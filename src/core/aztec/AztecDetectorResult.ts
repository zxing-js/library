/*
 * Copyright 2010 ZXing authors
 *
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

import ResultPoint from '../ResultPoint';
import BitMatrix from '../common/BitMatrix';
import DetectorResult from '../common/DetectorResult';

/**
 * <p>Extends {@link DetectorResult} with more information specific to the Aztec format,
 * like the number of layers and whether it's compact.</p>
 *
 * @author Sean Owen
 */
export default class AztecDetectorResult extends DetectorResult {

    private compact: boolean;
    private nbDatablocks: number;
    private nbLayers: number;

    public constructor(bits: BitMatrix,
        points: ResultPoint[],
        compact: boolean,
        nbDatablocks: number,
        nbLayers: number) {
        super(bits, points);
        this.compact = compact;
        this.nbDatablocks = nbDatablocks;
        this.nbLayers = nbLayers;
    }

    public getNbLayers(): number {
        return this.nbLayers;
    }

    public getNbDatablocks(): number {
        return this.nbDatablocks;
    }

    public isCompact(): boolean {
        return this.compact;
    }
}
