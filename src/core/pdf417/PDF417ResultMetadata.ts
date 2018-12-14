/*
 * Copyright 2013 ZXing authors
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

// package com.google.zxing.pdf417;

/**
 * @author Guenther Grau
 */
export default /*public final*/ class PDF417ResultMetadata {

    private segmentIndex: /*int*/ number;
    private fileId: string;
    private lastSegment: boolean;
    private segmentCount: /*int*/ number = -1;
    private sender: string;
    private addressee: string;
    private fileName: string;
    private fileSize: /*long*/ number = -1;
    private timestamp: /*long*/ number = -1;
    private checksum: /*int*/ number = -1;
    private optionalData: /*int[]*/ number;

    /**
     * The Segment ID represents the segment of the whole file distributed over different symbols.
     *
     * @return File segment index
     */
    public getSegmentIndex(): /*int*/ number {
        return segmentIndex;
    }

    public setSegmentIndex(segmentIndex: /*int*/ number): void {
        this.segmentIndex = segmentIndex;
    }

    /**
     * Is the same for each related PDF417 symbol
     *
     * @return File ID
     */
    public getFileId(): string {
        return fileId;
    }

    public setFileId(fileId: string): void {
        this.fileId = fileId;
    }

    /**
     * @return always null
     * @deprecated use dedicated already parsed fields
     */
    //   @Deprecated
    public getOptionalData(): Int32Array {
        return optionalData;
    }

    /**
     * @param optionalData old optional data format as int array
     * @deprecated parse and use new fields
     */
    //   @Deprecated
    public setOptionalData(optionalData: Int32Array): void {
        this.optionalData = optionalData;
    }


    /**
     * @return true if it is the last segment
     */
    public isLastSegment(): boolean {
        return lastSegment;
    }

    public setLastSegment(lastSegment: boolean): void {
        this.lastSegment = lastSegment;
    }

    /**
     * @return count of segments, -1 if not set
     */
    public getSegmentCount(): /*int*/ number {
        return segmentCount;
    }

    public setSegmentCount(segmentCount: number /*int*/): void {
        this.segmentCount = segmentCount;
    }

    public getSender(): string {
        return sender;
    }

    public setSender(sender: string): void {
        this.sender = sender;
    }

    public getAddressee(): string {
        return addressee;
    }

    public setAddressee(addressee: string): void {
        this.addressee = addressee;
    }

    /**
     * Filename of the encoded file
     *
     * @return filename
     */
    public getFileName(): string {
        return fileName;
    }

    public setFileName(fileName: string): void {
        this.fileName = fileName;
    }

    /**
     * filesize in bytes of the encoded file
     *
     * @return filesize in bytes, -1 if not set
     */
    public getFileSize(): /*long*/ number {
        return fileSize;
    }

    public setFileSize(fileSize: number /*long*/): void {
        this.fileSize = fileSize;
    }

    /**
     * 16-bit CRC checksum using CCITT-16
     *
     * @return crc checksum, -1 if not set
     */
    public getChecksum(): /*int*/ number {
        return checksum;
    }

    public setChecksum(checksum: number/*int*/): void {
        this.checksum = checksum;
    }

    /**
     * unix epock timestamp, elapsed seconds since 1970-01-01
     *
     * @return elapsed seconds, -1 if not set
     */
    public getTimestamp(): /*long*/ number {
        return timestamp;
    }

    public setTimestamp(timestamp: number /*long*/): void {
        this.timestamp = timestamp;
    }

}
