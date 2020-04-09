/**
 * This file contains some types to make our
 * lifes easier when copy and pasting Java code.
 * With it we can keep int, float, etc., references
 * in code to keep as close as possible as the Java version
 * but without the need to sacrifice ourselves with boring
 * and annoying things.
 */

// numeric formats
export declare type byte = number;
export declare type short = number;
export declare type int = number;
export declare type float = number;

// special formats
export type char = number;

// list formats
export type List<T> = Array<T>;
export type Collection<T> = Array<T>;
export type Deque<T> = Array<T>;
