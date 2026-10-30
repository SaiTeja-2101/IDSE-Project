# Upstream provenance and baseline

Hire and Seek adapts **Survival of the Best Fit**, created by Alia ElKattan,
Miha Klasinc, Gabor Csapo, and Jihyun Kim.

- Source: https://github.com/survivalofthebestfit/survivalofthebestfit
- Imported revision: `ecf9bee80dd4889a8960c5a987783f37fd09aa55`
- Source commit date: 2024-07-29
- Import date: 2026-10-30
- Original project description: [upstream README](upstream/README.md)

The source was cloned into a temporary checkout and copied without its `.git`
directory. The assignment repository has independent history on `hire-and-seek`.
The original project and author credits remain here and in the project README.

## Retained baseline

The import retains the game and website source, PixiJS scenes, applicant sprites,
VT323 font, sound files, Pug templates, Sass, Browserify/Gulp build definitions,
and `ml-cart` classifier integration. Generated `dist/` files are rebuilt locally
and are excluded from assignment commits.

## License and asset review

Both imported package manifests declare **MIT**. The upstream tree does not
contain a standalone top-level LICENSE file or per-asset attribution files.
The package declarations are preserved rather than inventing an upstream notice.

The bundled VT323 font is credited to Peter Hull; its upstream SIL Open Font
License is retained in `docs/licenses/VT323-OFL.txt` when retrieved during setup.

The original graphics and audio have been inventoried in
[the asset inventory](ASSETS.md). No separate author/license notices for those
media were found in the imported source. Their original provenance is retained;
this does not assert that package-level licensing resolves every media right.
Resolve any additional media permissions before distributing them beyond the
classroom/local development context. No external publication is part of Phases 0–1.

## Original behaviour to retain as a baseline, not endorse as final

- The original narrative and pink palette remain until the visual adaptation.
- The original statistics module substitutes fixed values in some branches.
- Original label preprocessing and model-selection paths need replacement in
  Phase 3 before the assignment's learning claims can be demonstrated.
- These are inherited behaviours, not evidence that Hire and Seek's new gameplay
  is implemented. The baseline is for testing the retained renderer and build.
