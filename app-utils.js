const core = {
    walk(obj, segments) {
        const stack = [{ from: null, path: null, next: obj }];

        while (segments.length > 0) {
            const top = segments.shift();

            if (obj && top in obj) {
                const next = obj[top];

                stack.push({ from: obj, path: top, next: next });
                obj = next;
            }
            else {
                stack.push({ from: obj, path: top, next: null });
                obj = null;
            }
        }

        return stack.pop();
    },

    merge(left, next) {
        const from = left.next;

        if (typeof next == 'undefined') {
            return;
        }

        if (typeof from == typeof next) {
            if (typeof from == 'object') {
                const a = from instanceof Array;
                const b = next instanceof Array;

                if (a == b) {
                    if (a) {
                        from.push(...next);
                    }
                    else {
                        for (const path of Object.keys(next)) {
                            core.merge({ from: from, path: path, next: from[path] }, next[path])
                        }
                    }

                    return from;
                }
            }
        }

        left.from[left.path] = next;
    }
};

module.exports = core;