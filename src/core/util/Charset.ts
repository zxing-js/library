import CharacterSetECI from '../common/CharacterSetECI';

/**
 * Just to make a shortcut between Java code and TS code.
 */
export default class Charset extends CharacterSetECI {

  public static forName(name: string): Charset {
    return this.getCharacterSetECIByName(name);
  }

}
