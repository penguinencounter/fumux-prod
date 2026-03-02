import type {RecipeSelectorPageName} from "./recipe_selector.ts"
import type {LibraryCheckout} from "../library/the_library.ts"


export interface IRecipeSelector {
    pushLoadPage(newPage: RecipeSelectorPageName): void
    openViewer(checkout: LibraryCheckout, replaceCurrent: boolean): void
    openSimpleEdit(checkout: LibraryCheckout | undefined, replaceCurrent: boolean): void
    back(): void
    loadPage(newPage: RecipeSelectorPageName): void
    close(): void
}

export interface RecipeSelectorPage extends Swappable {
    attach(parent: IRecipeSelector): void
    teardown(): void
}

