import Exception from '../core/Exception';
import Result from '../core/Result';

/**
 * Callback format for continuous decode scan.
 */
export type ContinuousDecodeCallback = (result: Result, error?: Exception) => any;
