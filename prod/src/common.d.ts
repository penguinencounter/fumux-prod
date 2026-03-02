// noinspection JSUnusedGlobalSymbols

declare global {
    export interface DataTransferItem {
        getAsEntry?: () => (FileSystemEntry | null)
    }
}

export type FileState = "analyze" | "analyzing" | "unusable" | "ready" | "processing" | "done" | "failed"

interface AbstractIORow {
    readonly id: string;

    changeInputDesc(desc: string): void;

    clearOutput(): void;

    onRemoved(action: (row: AbstractIORow) => void): void;

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

export interface Codec {
    type: "audio" | "video"
    name: string

    describe(): string
}

export interface Subscription<T> {
    resolve(result: T | PromiseLike<T>): void

    reject(reason?: any): void
}