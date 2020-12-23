import { Collection, int, List } from '../../customTypings';
import Comparator from './Comparator';

export default class Collections {

  /**
   * The singletonList(T) method is used to return an immutable list containing only the specified object.
 */
  static singletonList<T = any>(item: T): Collection<T> {
    return [item];
  }

  /**
   * Sorts the specified list according to the order induced by the specified comparator.
   */
  static sort<TToBeCompared = any>(
    list: List<TToBeCompared> | Array<TToBeCompared> | TToBeCompared[],
    comparator: Comparator<TToBeCompared>,
  ) {
    list.sort(comparator.compare);
  }

  /**
   * The min(Collection<? extends T>, Comparator<? super T>) method is used to return the minimum element of the given collection, according to the order induced by the specified comparator.
 */
  static min<T = any>(collection: Collection<T>, comparator: (a: T, b: T) => int): T {
    return collection.sort(comparator)[0];
  }

}
