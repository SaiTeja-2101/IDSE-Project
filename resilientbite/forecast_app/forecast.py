"""Prepare menu and demand records for the notebook's Random Forest."""

from io import BytesIO
from zipfile import BadZipFile

import numpy as np
import pandas as pd
from openpyxl.utils.exceptions import InvalidFileException
from sklearn.ensemble import RandomForestRegressor

TARGET = "actual_demand_portions"
ITEM = ["dining_hall", "meal", "food_item_id"]
KEY = ["date", *ITEM]
NAME = "food_item_name"
CALENDAR_FLAGS = ["is_vacation", "is_exam_period"]
LAGS = [(1, "yesterday"), (7, "last_week")]
FEATURES = ["is_weekend", *CALENDAR_FLAGS, "yesterday", "last_week"]
REQUIRED = [*KEY, NAME, TARGET]
MEAL_ORDER = {"breakfast": 0, "lunch": 1, "dinner": 2}


def read_upload(filename, contents):
    """Read CSV or the first Excel worksheet, then validate the project columns."""
    try:
        if filename.lower().endswith(".csv"):
            data = pd.read_csv(BytesIO(contents), dtype="string", keep_default_na=False)
        elif filename.lower().endswith(".xlsx"):
            data = pd.read_excel(BytesIO(contents), engine="openpyxl", dtype="string", keep_default_na=False)
        else:
            raise ValueError("Choose a .csv or .xlsx file.")
    except (pd.errors.ParserError, pd.errors.EmptyDataError, UnicodeDecodeError) as error:
        raise ValueError("The CSV could not be read. Save it as a UTF-8 CSV and try again.") from error
    except (BadZipFile, InvalidFileException, OSError, KeyError, SyntaxError, EOFError) as error:
        raise ValueError("The Excel file could not be read. Save it as an .xlsx workbook and try again.") from error

    return prepare_upload(data)


def prepare_upload(data):
    data = data.copy()
    data.columns = data.columns.astype(str).str.strip().str.lower()
    missing = [name for name in REQUIRED if name not in data.columns]
    if missing:
        raise ValueError(f"Required columns missing: {', '.join(missing)}.")
    if data.empty:
        raise ValueError("The file contains column headers but no menu or demand rows.")
    if data.columns.duplicated().any():
        raise ValueError("Each column must have a unique header.")

    for column in [*ITEM, NAME]:
        data[column] = data[column].astype("string").str.strip().replace("", pd.NA)
    dates = data["date"].astype("string").str.strip()
    # Excel date cells may include a midnight time after conversion to text.
    date_only = dates.str.fullmatch(r"\d{4}-\d{2}-\d{2}(?: 00:00:00)?")
    data["date"] = pd.to_datetime(dates.where(date_only).str[:10], format="%Y-%m-%d", errors="coerce")
    bad_keys = data[[*KEY, NAME]].isna().any(axis=1)
    if bad_keys.any():
        raise ValueError(f"{bad_keys.sum():,} rows have a missing item or invalid date. Use YYYY-MM-DD dates.")

    demand = pd.to_numeric(data[TARGET], errors="coerce")
    has_demand = data[TARGET].notna() & data[TARGET].astype("string").str.strip().ne("")
    bad_demand = has_demand & (demand.isna() | ~np.isfinite(demand) | demand.lt(0) | demand.mod(1).ne(0))
    if bad_demand.any():
        raise ValueError(f"{bad_demand.sum():,} rows have invalid demand. Use whole portions of 0 or more.")
    data[TARGET] = demand

    for flag in CALENDAR_FLAGS:
        if flag not in data:
            data[flag] = np.nan
        values = pd.to_numeric(data[flag], errors="coerce")
        has_value = data[flag].notna() & data[flag].astype("string").str.strip().ne("")
        if (has_value & ~values.isin([0, 1])).any():
            raise ValueError(f"Use 0 or 1 in {flag}, or leave it blank.")
        data[flag] = values

    data = data[[*REQUIRED, *CALENDAR_FLAGS]].drop_duplicates()
    if data.duplicated(KEY).any():
        raise ValueError("Conflicting rows share a date, hall, meal and item ID. Keep one record per combination.")
    return data


def train_model(source_path):
    """Rebuild the selected forest using the notebook's original training period."""
    source = pd.read_csv(source_path, parse_dates=["date"]).sort_values("date")
    dates = source["date"].drop_duplicates().reset_index(drop=True)
    validation_start = dates.iloc[int(0.6 * len(dates))]
    train = source[source["date"] < validation_start]
    for days, column in LAGS:
        previous = train[[*KEY, TARGET]].rename(columns={TARGET: column})
        previous["date"] += pd.Timedelta(days=days)
        train = train.merge(previous, on=KEY, how="left", validate="one_to_one")
    train = train.dropna(subset=["yesterday", "last_week"])
    forest = RandomForestRegressor(n_estimators=60, max_depth=8, random_state=42)
    return forest.fit(train[FEATURES], train[TARGET])


def forecast_for_day(data, day, model, vacation=False, exams=False):
    """Return the scheduled or estimated menu with per-item portions and history gaps."""
    day = pd.Timestamp(day).normalize()
    week_ago = day - pd.Timedelta(days=7)
    menu = data.loc[data["date"].eq(day)]
    menu_kind = "scheduled"
    if menu.empty:
        menu = data.loc[data["date"].eq(week_ago)]
        menu_kind = "last_week"
    if menu.empty:
        return pd.DataFrame(), "missing"

    menu = menu[[*ITEM, NAME, *CALENDAR_FLAGS]].copy()
    if menu_kind == "last_week":
        menu[CALENDAR_FLAGS] = np.nan
    menu["is_weekend"] = int(day.dayofweek >= 5)
    menu["is_vacation"] = menu["is_vacation"].fillna(int(vacation))
    menu["is_exam_period"] = menu["is_exam_period"].fillna(int(exams))

    for days, column in LAGS:
        history_date = day - pd.Timedelta(days=days)
        history = data.loc[data["date"].eq(history_date), [*ITEM, TARGET]]
        menu = menu.merge(history.rename(columns={TARGET: column}), on=ITEM, how="left", validate="one_to_one")

    ready = menu[["yesterday", "last_week"]].notna().all(axis=1)
    menu["predicted_portions"] = pd.Series(pd.NA, index=menu.index, dtype="Int64")
    if ready.any():
        prediction = model.predict(menu.loc[ready, FEATURES])
        menu.loc[ready, "predicted_portions"] = np.rint(prediction.clip(min=0)).astype(int)
    menu["status"] = "Forecast ready"
    menu.loc[menu["last_week"].isna(), "status"] = "Missing last week"
    menu.loc[menu["yesterday"].isna(), "status"] = "Missing yesterday"
    menu.loc[menu["yesterday"].isna() & menu["last_week"].isna(), "status"] = "Missing both dates"
    menu["date"] = day.date()

    meal_order = menu["meal"].str.lower().map(MEAL_ORDER).fillna(len(MEAL_ORDER))
    menu = menu.assign(meal_order=meal_order).sort_values(["meal_order", "meal", "dining_hall", NAME])
    return menu.drop(columns="meal_order"), menu_kind
