import assert from 'node:assert/strict';
import test from 'node:test';
import { checkUrlRegistryHistory } from './check-url-registry-history.mjs';

const registry = (articles) => ({ version: 1, articles });

test('URL registry history accepts additions and active retirement', () => {
    const previous = registry({
        current: { status: 'active' },
        redirected: { status: 'redirect', to: 'current' },
        removed: { status: 'gone' },
    });
    const current = registry({
        current: { status: 'gone' },
        redirected: { status: 'redirect', to: 'replacement' },
        removed: { status: 'gone' },
        replacement: { status: 'active' },
    });

    assert.doesNotThrow(() => checkUrlRegistryHistory(previous, current));
});

test('URL registry history rejects deleting a published ID', () => {
    const previous = registry({ old: { status: 'active' } });
    const current = registry({});

    assert.throws(
        () => checkUrlRegistryHistory(previous, current),
        /URL registry entry "old" was removed/,
    );
});

test('URL registry history can explicitly forget an unpublished ID', () => {
    const previous = registry({ demo: { status: 'gone' } });
    const current = registry({});

    assert.doesNotThrow(() => checkUrlRegistryHistory(previous, current, ['demo']));
});

test('URL registry history rejects reactivating a reserved ID', () => {
    for (const status of ['redirect', 'gone']) {
        const previous = registry({ old: { status } });
        const current = registry({ old: { status: 'active' } });

        assert.throws(
            () => checkUrlRegistryHistory(previous, current),
            new RegExp(`changed from "${status}" back to "active"`),
        );
    }
});
