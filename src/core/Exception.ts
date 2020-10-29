import { CustomError } from 'ts-custom-error';

/**
 * Custom Error class of type Exception.
 */
export default class Exception extends CustomError {

  /**
   * It's typed as string so it can be extended and overriden.
   */
  static readonly kind: string = 'Exception';

  /**
   * Allows Exception to be constructed directly
   * with some message and prototype definition.
   */
  constructor(
    public message: string = undefined
  ) {
    super(message);
  }

  public getKind(): string {
    const ex = <typeof Exception>this.constructor;
    return ex.kind;
  }
}
