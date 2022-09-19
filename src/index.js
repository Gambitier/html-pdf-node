const puppeteer = require('puppeteer');
const juice = require('juice');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

module.exports = () => {
	const templatesDir = path.join('src', 'templates');

	const TEMP_CERTIFICATE_FOLDER = path.join(process.cwd(), './temp');

	const service = {};

	const getFullPath = (relativePath) => path.join(templatesDir, relativePath);

	const fileExists = (filePath) =>
		// eslint-disable-next-line implicit-arrow-linebreak
		new Promise((resolve, reject) => {
			if (!filePath.startsWith(templatesDir + path.sep)) {
				return reject(new Error('Invalid template path'));
			}

			fs.access(filePath, fs.constants.R_OK, (err) => resolve(!err));
		});

	const renderEjs = async (filename, data) => {
		const html = await ejs.renderFile(filename, data, { async: true });
		return html;
	};

	const processIfExists = async (filename, data, func) => {
		const exists = await fileExists(filename);

		if (exists) {
			return func(filename, data);
		}

		throw new Error(`file ${filename} is not readable`);
	};

	service.processTemplate = async (data) => {
		const { templateName, templateOptions, htmlFilePath } = data;

		const pathEjsHtmlBody = getFullPath(`${templateName}.ejs`);

		const ejsHtmlBody = await processIfExists(
			pathEjsHtmlBody,
			templateOptions,
			renderEjs
		);
		// The HTML output of the template is passed
		// through juice for inlining the CSS styles.
		const html = juice(ejsHtmlBody || '');

		try {
			await fs.promises.writeFile(htmlFilePath, html);
		} catch (error) {
			console.log(error);
			throw error;
		}

		return htmlFilePath;
	};

	service.doWork = async (data) => {
		const { templateName, templateOptions } = data;

		const timestamp = new Date().getTime().toString();
		const folder = path.join(TEMP_CERTIFICATE_FOLDER, timestamp);
		await fs.promises.mkdir(folder, {
			recursive: true,
		});

		const htmlFilePath = path.join(folder, `${timestamp}.html`);

		const pdfFilePath = path.join(folder, `${timestamp}.pdf`);

		const templatePath = await service.processTemplate({
			templateName: templateName,
			templateOptions: templateOptions,
			htmlFilePath: htmlFilePath,
		});

		// Although this will make your puppeteer code run, the developers discourage users from adding these flags as they can pose a security risk.
		// Only use the above two flags if you trust the content you will be opening in the headless Chrome browser using Puppeteer.
		// puppetter.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
		const browser = await puppeteer.launch({
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
		const page = await browser.newPage();

		await page.goto(`file:///${templatePath}`, {
			waitUntil: 'networkidle2',
		});

		await page.pdf({
			path: pdfFilePath,
			format: 'a4',
			printBackground: true,
		});

		await browser.close();

		return pdfFilePath;
	};

	service.convertHtmlToPdf = async (data) => {
		return service.doWork(data);
	};

	return service;
};
