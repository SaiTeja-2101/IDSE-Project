from base64 import b64encode
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
import streamlit as st

from forecast import forecast_for_day, prepare_upload, read_upload, train_model

SOURCE = Path(__file__).resolve().parent.parent / "resilientbite_master_extended.csv"
DEMO_DATE = date(2024, 11, 25)
LOGO = b64encode(Path(__file__).with_name("loading_logo.png").read_bytes()).decode("ascii")

st.set_page_config(page_title="ResilientBite | Daily food forecast", page_icon="🍽️", layout="wide")
st.markdown(
    """
    <style>
      .stApp {background: #f1eee7; color: #26333f;}
      [data-testid="stHeader"], [data-testid="stStatusWidget"] {display: none;}
      .forecast-loading {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: grid;
        place-items: center;
        background: #f1eee7;
      }
      .forecast-loading img {width: 88px; height: 88px;}
      h1, h2, h3 {color: #233b50 !important;}
      [data-testid="stVerticalBlockBorderWrapper"] {background: #fcfaf5; border-color: #c5c7c5;}
      [data-testid="stFileUploaderDropzone"] {background: #e6ebef; border: 1px dashed #61778b; border-radius: .35rem;}
      [data-testid="stMetric"] {background: #e6ebef; border-radius: .35rem; padding: 1rem;}
      .stButton button, .stDownloadButton button {background: #324e65; color: white; border-color: #324e65;}
      .block-container {max-width: 72rem; padding-top: 1.75rem; padding-bottom: 2rem;}
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource(show_spinner=False)
def load_model(dataset, modified):
    return train_model(dataset)


@st.cache_data(show_spinner=False)
def load_demo(dataset, modified):
    return prepare_upload(pd.read_csv(dataset, dtype={"food_item_id": "string"}))


@st.cache_data(show_spinner=False)
def load_upload(filename, contents):
    return read_upload(filename, contents)


st.title("ResilientBite")

with st.container(border=True):
    st.subheader("Upload menu and demand records")
    st.markdown(
        "**File format · CSV or Excel (.xlsx)**\n\n"
        "Include these six columns. For Excel, put them on the first sheet."
    )
    st.code("date, dining_hall, meal, food_item_id, food_item_name, actual_demand_portions", language=None)
    st.caption(
        "Use YYYY-MM-DD dates and the same hall, meal and item ID on each date. "
        "Add today's menu with demand blank, plus actual portions from yesterday and seven days ago."
    )
    upload = st.file_uploader(
        "Upload or replace your file", type=["csv", "xlsx"], key="menu_file",
    )
    if upload is not None:
        st.caption(f"Using {upload.name}. Upload a new file here to replace it.")

vacation, exams = False, False
demo_date = None
if upload is not None:
    with st.expander("Calendar defaults"):
        st.caption("Optional is_vacation and is_exam_period columns accept 0 or 1. These defaults apply where a value is blank.")
        vacation = st.checkbox("Campus vacation")
        exams = st.checkbox("Exam period")
else:
    with st.expander("Historical demo"):
        st.caption("Replay a day from the 2024 project dataset.")
        if st.checkbox("Use the 2024 project data"):
            demo_date = st.date_input(
                "Forecast date", DEMO_DATE, min_value=date(2024, 1, 8), max_value=date(2024, 12, 30),
            )


@st.fragment(run_every="1m")
def show_forecast(upload, demo_date, vacation, exams):
    target_day = demo_date if demo_date is not None else date.today()
    st.subheader(f"Forecast for {target_day:%A, %d %B %Y}")
    if upload is None and demo_date is None:
        st.info("Your forecast will appear automatically after you upload a file.")
        return

    loading = st.empty()
    loading.html(
        f'<div class="forecast-loading" role="status" aria-label="Preparing forecast">'
        f'<img src="data:image/png;base64,{LOGO}" alt=""></div>'
    )
    try:
        if demo_date is not None:
            data = load_demo(SOURCE, SOURCE.stat().st_mtime_ns)
        else:
            data = load_upload(upload.name, upload.getvalue())

        model = load_model(SOURCE, SOURCE.stat().st_mtime_ns)
        menu, menu_kind = forecast_for_day(data, target_day, model, vacation, exams)
    except ValueError as error:
        st.error(str(error))
        return
    finally:
        loading.empty()

    if menu_kind == "missing":
        last_date = data["date"].max().date()
        st.warning(
            f"The file has no menu for {target_day:%d %b %Y} or the same day last week. "
            f"The latest date in the file is {last_date:%d %b %Y}."
        )
        st.write("Replace the file with the target date's menu and the two earlier dates of actual demand.")
        return
    if menu_kind == "last_week":
        st.warning(f"Estimated menu from {target_day - timedelta(days=7):%d %b %Y}. Confirm today's dishes before using the forecast.")
    else:
        st.caption("Menu from the project dataset" if demo_date is not None else f"Scheduled menu · {upload.name}")

    count = menu["predicted_portions"].count()
    total = menu["predicted_portions"].sum()
    metrics = st.columns(3)
    metrics[0].metric("Menu rows", f"{len(menu):,}", border=True)
    metrics[1].metric("Forecasts available", f"{count:,} / {len(menu):,}", border=True)
    metrics[2].metric("Predicted portions" if count == len(menu) else "Portions forecast so far",
                      f"{total:,}" if count else "—", border=True)
    if count < len(menu):
        st.warning(
            f"{len(menu) - count:,} rows need more history. Add matching records for "
            f"{target_day - timedelta(days=1):%d %b} and {target_day - timedelta(days=7):%d %b}."
        )

    hall_col, meal_col = st.columns(2)
    hall = hall_col.selectbox("Dining hall", ["All halls", *sorted(menu["dining_hall"].unique())])
    meal = meal_col.selectbox("Meal", ["All meals", *menu["meal"].unique()])
    visible = menu
    if hall != "All halls":
        visible = visible[visible["dining_hall"].eq(hall)]
    if meal != "All meals":
        visible = visible[visible["meal"].eq(meal)]
    columns = {
        "meal": "Meal",
        "dining_hall": "Dining hall",
        "food_item_name": "Food item",
        "predicted_portions": "Predicted portions",
    }
    table = visible[list(columns)].rename(columns=columns)
    st.dataframe(
        table, hide_index=True, height=395,
        column_config={"Predicted portions": st.column_config.NumberColumn(format="%d")},
    )
    st.download_button(
        "Download forecast CSV",
        table.to_csv(index=False).encode("utf-8"),
        f"resilientbite_forecast_{target_day}.csv",
        "text/csv",
    )
    st.caption("Random Forest · 60 trees · maximum depth 8 · counts rounded to whole portions")


show_forecast(upload, demo_date, vacation, exams)
