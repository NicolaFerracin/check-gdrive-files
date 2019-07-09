const fs = require('fs');
const util = require('util');
const path = require('path');
const GDrive = require('./GDrive');

const copyFile = util.promisify(fs.copyFile);

const CONSTANTS = {
  MODE: {
    COPY: 'COPY',
    DRY: 'DRY'
  },
  REPORT_TYPE: {
    FOUND: 'FOUND',
    NOT_FOUND: 'NOT_FOUND'
  },
  REPORT_NAME: {
    FOUND: 'found',
    NOT_FOUND: 'not_found'
  }
};

class GDriveChecker {
  constructor(path, arg) {
    this.gDrive;
    this.init(path, arg);
    this.counter = 0;
  }

  initReportDest(arg) {
    if (!arg.includes('--dry-run')) {
      this.mode = CONSTANTS.MODE.COPY;
      if (!fs.existsSync(path.join(__dirname, `../${CONSTANTS.REPORT_NAME.FOUND}`))) {
        fs.mkdirSync(path.join(__dirname, `../${CONSTANTS.REPORT_NAME.FOUND}`));
      }
      if (!fs.existsSync(path.join(__dirname, `../${CONSTANTS.REPORT_NAME.NOT_FOUND}`))) {
        fs.mkdirSync(path.join(__dirname, `../${CONSTANTS.REPORT_NAME.NOT_FOUND}`));
      }
    } else {
      this.filesFound = fs.createWriteStream(
        path.join(__dirname, `../${CONSTANTS.REPORT_NAME.FOUND}.txt`)
      );
      this.filesNotFound = fs.createWriteStream(
        path.join(__dirname, `../${CONSTANTS.REPORT_NAME.NOT_FOUND}.txt`)
      );
    }
  }

  async init(path, arg) {
    this.mode = CONSTANTS.MODE.DRY;
    this.initReportDest(arg);

    this.files = [];
    this.checkedFiles = 0;

    this.gDrive = new GDrive();
    await this.gDrive.init();

    this.processPath(path);
    this.checkFiles();
  }

  async processPath(path) {
    if (fs.existsSync(path) && fs.lstatSync(path).isDirectory()) {
      fs.readdirSync(path).forEach(nestedPath => this.processPath(`${path}/${nestedPath}`));
    } else {
      this.files.push(path);
    }
  }

  checkFiles() {
    this.files.forEach(this.checkFile.bind(this));
  }

  async checkFile(filePath) {
    const fileName = filePath.split('/').pop();
    this.counter++;
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 200 * this.counter);
    });
    const files = await this.gDrive.runSample(fileName);
    console.log(`${files.length} files found with name: ${fileName}`);
    if (files.length) {
      await this.reportFile(CONSTANTS.REPORT_TYPE.FOUND, filePath, fileName);
    } else {
      await this.reportFile(CONSTANTS.REPORT_TYPE.NOT_FOUND, filePath, fileName);
    }
    this.checkedFiles++;

    if (this.checkedFiles === this.files.length) {
      this.close();
    }
  }

  async reportFile(type, filePath, fileName) {
    if (this.mode === CONSTANTS.MODE.DRY) {
      if (type === CONSTANTS.REPORT_TYPE.FOUND) {
        this.filesFound.write(fileName);
        this.filesFound.write('\r\n');
      } else if (type === CONSTANTS.REPORT_TYPE.NOT_FOUND) {
        this.filesNotFound.write(fileName);
        this.filesNotFound.write('\r\n');
      }
    } else if (this.mode === CONSTANTS.MODE.COPY) {
      if (type === CONSTANTS.REPORT_TYPE.FOUND) {
        await copyFile(
          filePath,
          path.join(__dirname, `../${CONSTANTS.REPORT_NAME.FOUND}/${fileName}`)
        );
      } else if (type === CONSTANTS.REPORT_TYPE.NOT_FOUND) {
        await copyFile(
          filePath,
          path.join(__dirname, `../${CONSTANTS.REPORT_NAME.NOT_FOUND}/${fileName}`)
        );
      }
    }
  }

  close() {
    if (this.mode === CONSTANTS.MODE.DRY) {
      this.filesFound.end();
      this.filesNotFound.end();
    }
  }
}

(() => new GDriveChecker(process.argv[2], process.argv.slice(3)))();
