# action-gh-release-repro

Demonstrates that invoking `softprops/action-gh-release` multiple times in a row to add files to a release from multiple jobs will create divergent releases unless you add a delay via something like `sleep 10`.

Use case: you have 5 artifacts in a repo that are all built in parallel and added to the release as those build jobs complete.

Right now there is a race condition and each artifact may instead cause a release. In the worst case, you end up with 5 separate releases each only having 1 of the 5 files.

In the least-worst case, you end up with 2 releases. One has 4 artifacts and the other release has the missing 5th artifact.

We currently run `softprops/action-gh-release` once before all those artifact jobs to create an empty release for those 5 build jobs to add their output to. If the build was too quick, or cached, or added only no-op changelog files, we could end up with multiple, incorrect, separate releases as described above.

This seems to happen because the GH API calls in `softprops/action-gh-release` to check whether a release already exists for the tag has a delay in when it begins to show that new releases exist. Creating a release through the GH API and then, afterwards, immediately querying for that release through the GH API would show that it does not yet exist. This causes the race condition in `softprops/action-gh-release`.
