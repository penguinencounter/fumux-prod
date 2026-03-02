// noinspection JSUnusedGlobalSymbols

type Base64Options = {
    alphabet?: "base64" | "base64url"
}
type ReadBase64Options = Base64Options & {
    lastChunkHandling?: "loose" | "strict" | "stop-before-partial"
}
type WriteBase64Options = Base64Options & {
    omitPadding?: boolean
}

declare global {
    export interface DataTransferItem {
        getAsEntry?: () => (FileSystemEntry | null)
    }

    export interface Uint8Array {
        toBase64(options?: WriteBase64Options): string
    }

    export interface Uint8ArrayConstructor {
        fromBase64(base64: string, options?: ReadBase64Options): Uint8Array<ArrayBuffer>
    }
}

export type FileState = "analyze" | "analyzing" | "unusable" | "ready" | "processing" | "done" | "failed"

interface AbstractIORow {
    readonly id: string;

    changeInputDesc(desc: string): void;

    clearOutput(): void;

    onRemovedByUser(action: (row: AbstractIORow) => void): void;

    isValid(): any;

    removeVisuals(): void;
}

export interface TaggedFile {
    file: File
    id: string
    description: string
    state: FileState
    row: AbstractIORow | null
}

export interface Pairing {
    id: string
    inp: TaggedFile
    out?: TaggedFile
}

export interface Codec {
    type: "audio" | "video" | "subtitle"
    name: string

    describe(): string
}

export interface Subscription<T> {
    resolve(result: T | PromiseLike<T>): void

    reject(reason?: any): void
}