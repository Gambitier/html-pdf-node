const Service = require('./src/index');
const Template = require('./src/constants');

(async () => {
	const HtmlToPdfGenerationService = Service();
	await HtmlToPdfGenerationService.convertHtmlToPdf({
		templateName: Template.welcome,
		templateOptions: {
			name: 'Akash',
			action_url: 'gambitier.github.io',
			login_url: 'gambitier.github.io',
			username: 'gambitier',
			trial_length: 5,
			trial_start_date: 'july-1st',
			trial_end_date: 'aug-31',
			support_email: 'csegambitier@gmail.com',
			live_chat_url: 'gambitier.github.io',
			help_url: 'gambitier.github.io',
		},
	});
})();
