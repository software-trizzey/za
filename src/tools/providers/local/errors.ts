export class LocalToolInputValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LocalToolInputValidationError";
	}
}
