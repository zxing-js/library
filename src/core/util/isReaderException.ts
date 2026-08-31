/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import ChecksumException from '../ChecksumException';
import FormatException from '../FormatException';
import NotFoundException from '../NotFoundException';
import ReaderException from '../ReaderException';

/**
 * In the Java original, {@code NotFoundException}, {@code FormatException} and
 * {@code ChecksumException} all extend {@code ReaderException}, so `catch (ReaderException)` means
 * "any failure to read this image". In this port the four are siblings that extend
 * {@code Exception} directly, so `instanceof ReaderException` would match only the base type and
 * let the others escape.
 *
 * This restores the Java semantics for the multi readers, which rely on being able to skip an
 * undecodable candidate and carry on with the rest of the image.
 */
export default function isReaderException(e: any): boolean {
    return e instanceof ReaderException ||
        e instanceof NotFoundException ||
        e instanceof FormatException ||
        e instanceof ChecksumException;
}
