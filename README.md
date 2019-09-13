# Check GDrive Files

Node.js script to check if files in a given directory are found or not on the authenticated Google Drive.

The script has been written for a personal need as I was changing backup strategy from Amazon Drive to Google Drive and was unsure of what files I had alredy uploaded and to check for duplicates.

## How it works

This script uses the [`googleapis` npm package](https://www.npmjs.com/package/googleapis) to authenticate the user to their GDrive account and execute queries against it.

The input is either a file or a directory. In case of directories, they will scanned recursively.

Based on the usage of the [options](#options) The script will either:

- output the list of files in 2 files (`found.txt` / `not_found.txt`) or
- copy the local files into 2 separate directories (`found` / `not_found`)

During authentication the script will generate the `token.json` file that will be used for future executions to avoid re-authenticating.

The script uses a throttle of 200ms to avoid exceeding the rate limits.

## How to use

### Clone the repo

`git clone https://github.com/NicolaFerracin/check-gdrive-files.git`

### Install dependencies

`cd ./check-gdrive-files && npm i`

### (Optional) Replace credentials.json

The `credentials.json` file contains the information of the application that will be used to access your Google Drive data. You can either leave the default credentials (taken from [here](https://developers.google.com/drive/api/v3/quickstart/nodejs)) or you can create your own app and credentials using the [Google Developer Console](https://console.developers.google.com).

### Run the script

`node ./src/ <path-to-file-or-dir> <options>`

## Options

The only option at the moment is `--dry-run`:

- running the script with `--dry-run` will create 2 files (`found.txt` and `not_found.txt`) with a list of the files per category.
- running the script without `--dry-run` will create 2 directories (`found` and `not_found`) that will be populated with the copy of the files scanned.
