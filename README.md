# GitHub action to notify you of old branches

After installation this action will read all of the branches in your repository and figure out which are older than 90 days.

If it finds any it will create an issue listing all of the branches and tag the user that made the last commit on that branch.

## Installation

To configure the action add the following lines to your `.github/workflows/old-branches.yml` workflow file:

```yml
on:
  schedule:
    # Run every day at 9 am.
    - cron:  '0 9 * * *'
name: Old Branch Reminder
jobs:
  remind:
    name: Old Branch Reminder
    runs-on: ubuntu-latest
    steps:
    - name: Old Branch Reminder
      uses: arup-group/action-notify-unused-branches@v5
      with:
        daysOld: 90
        excludedAuthor: peterjgrainger
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
