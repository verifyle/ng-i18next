import * as angular from 'angular';
import { i18n, InitOptions, InterpolationOptions } from 'i18next';
import { Ii18nTranslateService } from './interfaces';

declare var i18next: i18n;

export class I18nTranslateService implements Ii18nTranslateService {
	public options: InitOptions = {};
	public tOptions: any = {};
	public interpolationOptions: InterpolationOptions;

	public modules: any[] = [];

	private translations: any = {};
	private i18n: i18n = i18next;

	constructor(private $rootScope: ng.IRootScopeService, translationOptions: any) {
		this.tOptions = translationOptions;
		this.initializeI18next();
	}

	public t(key: string, ownOptions: any) {
		const hasOwnOptions: boolean = angular.isDefined(ownOptions);
		const hasOwnNsOption: boolean = hasOwnOptions && angular.isDefined(ownOptions.ns);
		const hasInitNsObj: boolean = angular.isDefined(this.options) && angular.isDefined(this.options.ns);
		let defaultOptions: InitOptions = this.options;
		let mergedOptions: any;
		let lng: string;

		// https://github.com/i18next/i18next/blob/e47bdb4d5528c752499b0209d829fde4e1cc96e7/src/i18next.translate.js#L232
		// Because of i18next read namespace from `options.ns`
		if (angular.isUndefined(hasOwnNsOption) && hasInitNsObj) {
			defaultOptions = angular.extend({}, this.options);
			defaultOptions.ns = defaultOptions.defaultNS;
		}

		mergedOptions = hasOwnOptions ? ownOptions : this.tOptions;

		// https://github.com/i18next/i18next/blob/7af53d5a01cc9942c0edae361bd2f65361e340c9/src/i18next.translate.js#L289
		// lng will be deleted in some case
		lng = mergedOptions.lng;

		this.translate(key, mergedOptions, hasOwnOptions);

		return angular.isDefined(lng) ? this.translations[lng][key] : this.translations.auto[key];
	}

	public changeLanguage(lng: string) {
		if (this.options.lng !== lng && this.i18n.language !== lng) {
			this.options.lng = lng;
			this.i18n.changeLanguage(lng, (err, t) => {
				this.$rootScope.$broadcast('i18nextLanguageChange', this.i18n.language);
				this.translations = {};
			});
		}
	}

	public changeOptions(options: InitOptions) {
		if (angular.isDefined(options)) {
			this.options = options;
		}
	}

	private initializeI18next() {
		const self = this;

		if (i18next) {
			// assign instance of i18next
			this.i18n = i18next;
			this.options = i18next.options;
		} else {
			const error = new Error('[ng-i18next] Can\'t find i18next and/or i18next options! Please refer to i18next.');
			this.handleError(error);
		}

		i18next.on('initialized', (options) => {
			self.options = options;
			self.$rootScope.$broadcast('i18nextLanguageChange', self.options.lng);
		});
	}

	private translate(key: string, tOptions: any, hasOwnOptions: boolean) {
		const localOptions: any = angular.isDefined(tOptions) && hasOwnOptions ? tOptions : this.tOptions;
		const lng = localOptions.lng || 'auto';

		if (angular.isUndefined(this.translations[lng])) {
			this.translations[lng] = {};
		}

		if (angular.isUndefined(this.i18n)) {
			this.translations[lng][key] = angular.isDefined(localOptions.defaultValue) ? localOptions.defaultValue : key;
		} else if (angular.isUndefined(this.translations[lng][key]) || hasOwnOptions) {
			this.translations[lng][key] = this.i18n.t(key, localOptions);
		}
	}

	private handleError(error: any) {
		const message = angular.isDefined(error.message) ? error.message : error[0];
		// tslint:disable-next-line:no-console
		console.log(message);
	}
}
