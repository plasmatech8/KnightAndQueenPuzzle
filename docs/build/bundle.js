
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var kingLight = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <path d=\"M 22.5,11.63 L 22.5,6\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\"/>\n    <path d=\"M 20,8 L 25,8\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\"/>\n    <path d=\"M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25\" style=\"fill:#ffffff; stroke:#000000; stroke-linecap:butt; stroke-linejoin:miter;\"/>\n    <path d=\"M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37\" style=\"fill:#ffffff; stroke:#000000;\"/>\n    <path d=\"M 12.5,30 C 18,27 27,27 32.5,30\" style=\"fill:none; stroke:#000000;\"/>\n    <path d=\"M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5\" style=\"fill:none; stroke:#000000;\"/>\n    <path d=\"M 12.5,37 C 18,34 27,34 32.5,37\" style=\"fill:none; stroke:#000000;\"/>\n  </g>\n</svg>\n";

    var queenLight = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <path d=\"M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z\" transform=\"translate(-1,-1)\"/>\n    <path d=\"M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z\" transform=\"translate(15.5,-5.5)\"/>\n    <path d=\"M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z\" transform=\"translate(32,-1)\"/>\n    <path d=\"M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z\" transform=\"translate(7,-4)\"/>\n    <path d=\"M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z\" transform=\"translate(24,-4)\"/>\n    <path d=\"M 9,26 C 17.5,24.5 27.5,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,11 L 14,25 L 7,14 L 9,26 z \" style=\"stroke-linecap:butt;\"/>\n    <path d=\"M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z\" style=\"stroke-linecap:butt;\"/>\n    <path d=\"M 11.5,30 C 15,29 30,29 33.5,30\" style=\"fill:none;\"/>\n    <path d=\"M 12,33.5 C 18,32.5 27,32.5 33,33.5\" style=\"fill:none;\"/>\n  </g>\n</svg>\n";

    var rookLight = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <path\n      d=\"M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z \"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z \"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14\"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 34,14 L 31,17 L 14,17 L 11,14\" />\n    <path\n      d=\"M 31,17 L 31,29.5 L 14,29.5 L 14,17\"\n      style=\"stroke-linecap:butt; stroke-linejoin:miter;\" />\n    <path\n      d=\"M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5\" />\n    <path\n      d=\"M 11,14 L 34,14\"\n      style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\" />\n  </g>\n</svg>\n";

    var bishobLight = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <g style=\"fill:#ffffff; stroke:#000000; stroke-linecap:butt;\">\n      <path d=\"M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z\"/>\n      <path d=\"M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z\"/>\n      <path d=\"M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z\"/>\n    </g>\n    <path d=\"M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\"/>\n  </g>\n</svg>\n";

    var knightLight = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <path\n      d=\"M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18\"\n      style=\"fill:#ffffff; stroke:#000000;\" />\n    <path\n      d=\"M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10\"\n      style=\"fill:#ffffff; stroke:#000000;\" />\n    <path\n      d=\"M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z\"\n      style=\"fill:#000000; stroke:#000000;\" />\n    <path\n      d=\"M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z\"\n      transform=\"matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)\"\n      style=\"fill:#000000; stroke:#000000;\" />\n  </g>\n</svg>\n";

    var pawnLight = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <path d=\"m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z\" style=\"opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\"/>\n</svg>\n";

    var kingDark = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <path d=\"M 22.5,11.63 L 22.5,6\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\" id=\"path6570\"/>\n    <path d=\"M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25\" style=\"fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;\"/>\n    <path d=\"M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37\" style=\"fill:#000000; stroke:#000000;\"/>\n    <path d=\"M 20,8 L 25,8\" style=\"fill:none; stroke:#000000; stroke-linejoin:miter;\"/>\n    <path d=\"M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5\" style=\"fill:none; stroke:#ffffff;\"/>\n    <path d=\"M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37\" style=\"fill:none; stroke:#ffffff;\"/>\n  </g>\n</svg>\n";

    var queenDark = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:#000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <g style=\"fill:#000000; stroke:none;\">\n      <circle cx=\"6\" cy=\"12\" r=\"2.75\"/>\n      <circle cx=\"14\" cy=\"9\" r=\"2.75\"/>\n      <circle cx=\"22.5\" cy=\"8\" r=\"2.75\"/>\n      <circle cx=\"31\" cy=\"9\" r=\"2.75\"/>\n      <circle cx=\"39\" cy=\"12\" r=\"2.75\"/>\n    </g>\n    <path d=\"M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z\" style=\"stroke-linecap:butt; stroke:#000000;\"/>\n    <path d=\"M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z\" style=\"stroke-linecap:butt;\"/>\n    <path d=\"M 11,38.5 A 35,35 1 0 0 34,38.5\" style=\"fill:none; stroke:#000000; stroke-linecap:butt;\"/>\n    <path d=\"M 11,29 A 35,35 1 0 1 34,29\" style=\"fill:none; stroke:#ffffff;\"/>\n    <path d=\"M 12.5,31.5 L 32.5,31.5\" style=\"fill:none; stroke:#ffffff;\"/>\n    <path d=\"M 11.5,34.5 A 35,35 1 0 0 33.5,34.5\" style=\"fill:none; stroke:#ffffff;\"/>\n    <path d=\"M 10.5,37.5 A 35,35 1 0 0 34.5,37.5\" style=\"fill:none; stroke:#ffffff;\"/>\n  </g>\n</svg>\n";

    var rookDark = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:#000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <path\n      d=\"M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z \"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z \"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z \"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z \"\n      style=\"stroke-linecap:butt;stroke-linejoin:miter;\" />\n    <path\n      d=\"M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z \"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z \"\n      style=\"stroke-linecap:butt;\" />\n    <path\n      d=\"M 12,35.5 L 33,35.5 L 33,35.5\"\n      style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" />\n    <path\n      d=\"M 13,31.5 L 32,31.5\"\n      style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" />\n    <path\n      d=\"M 14,29.5 L 31,29.5\"\n      style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" />\n    <path\n      d=\"M 14,16.5 L 31,16.5\"\n      style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" />\n    <path\n      d=\"M 11,14 L 34,14\"\n      style=\"fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;\" />\n  </g>\n</svg>\n";

    var bishobDark = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <g style=\"fill:#000000; stroke:#000000; stroke-linecap:butt;\">\n      <path d=\"M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z\"/>\n      <path d=\"M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z\"/>\n      <path d=\"M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z\"/>\n    </g>\n    <path d=\"M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18\" style=\"fill:none; stroke:#ffffff; stroke-linejoin:miter;\"/>\n  </g>\n</svg>\n";

    var knightDark = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <g style=\"opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\">\n    <path\n      d=\"M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18\"\n      style=\"fill:#000000; stroke:#000000;\" />\n    <path\n      d=\"M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10\"\n      style=\"fill:#000000; stroke:#000000;\" />\n    <path\n      d=\"M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z\"\n      style=\"fill:#ffffff; stroke:#ffffff;\" />\n    <path\n      d=\"M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z\"\n      transform=\"matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)\"\n      style=\"fill:#ffffff; stroke:#ffffff;\" />\n    <path\n      d=\"M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z \"\n      style=\"fill:#ffffff; stroke:none;\" />\n  </g>\n</svg>\n";

    var pawnDark = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"45\" height=\"45\">\n  <path d=\"m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z\" style=\"opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;\"/>\n</svg>\n";

    /* src/components/Piece.svelte generated by Svelte v3.37.0 */
    const file$5 = "src/components/Piece.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let svg;
    	let raw_value = (/*spriteMap*/ ctx[2][/*color*/ ctx[1]]?.[/*type*/ ctx[0]] || "NA") + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			attr_dev(svg, "class", "svelte-1a2zyp7");
    			add_location(svg, file$5, 40, 2, 1135);
    			attr_dev(div, "class", "container svelte-1a2zyp7");
    			add_location(div, file$5, 39, 0, 1109);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			svg.innerHTML = raw_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color, type*/ 3 && raw_value !== (raw_value = (/*spriteMap*/ ctx[2][/*color*/ ctx[1]]?.[/*type*/ ctx[0]] || "NA") + "")) svg.innerHTML = raw_value;		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Piece", slots, []);
    	let { player = true } = $$props;
    	let { type = "queen" } = $$props;
    	let { color = "white" } = $$props;

    	let spriteMap = {
    		white: {
    			king: kingLight,
    			queen: queenLight,
    			rook: rookLight,
    			bishob: bishobLight,
    			knight: knightLight,
    			pawn: pawnLight
    		},
    		black: {
    			king: kingDark,
    			queen: queenDark,
    			rook: rookDark,
    			bishob: bishobDark,
    			knight: knightDark,
    			pawn: pawnDark
    		}
    	};

    	const writable_props = ["player", "type", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Piece> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("player" in $$props) $$invalidate(3, player = $$props.player);
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({
    		player,
    		type,
    		color,
    		kingLight,
    		queenLight,
    		rookLight,
    		bishobLight,
    		knightLight,
    		pawnLight,
    		kingDark,
    		queenDark,
    		rookDark,
    		bishobDark,
    		knightDark,
    		pawnDark,
    		spriteMap
    	});

    	$$self.$inject_state = $$props => {
    		if ("player" in $$props) $$invalidate(3, player = $$props.player);
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("spriteMap" in $$props) $$invalidate(2, spriteMap = $$props.spriteMap);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, color, spriteMap, player];
    }

    class Piece extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { player: 3, type: 0, color: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Piece",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get player() {
    		throw new Error("<Piece>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set player(value) {
    		throw new Error("<Piece>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Piece>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Piece>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Piece>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Piece>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Draggable.svelte generated by Svelte v3.37.0 */
    const file$4 = "src/components/Draggable.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "draggable svelte-18xzo9z");
    			set_style(div, "transform", "translate(" + /*deltaX*/ ctx[0] + "px, " + /*deltaY*/ ctx[1] + "px)");
    			add_location(div, file$4, 34, 0, 605);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "mouseup", /*handleDrop*/ ctx[3], false, false, false),
    					listen_dev(window, "mousemove", /*handleDrag*/ ctx[4], false, false, false),
    					listen_dev(div, "mousedown", /*handlePick*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*deltaX, deltaY*/ 3) {
    				set_style(div, "transform", "translate(" + /*deltaX*/ ctx[0] + "px, " + /*deltaY*/ ctx[1] + "px)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Draggable", slots, ['default']);
    	let startX = 0;
    	let startY = 0;
    	let deltaX = 0;
    	let deltaY = 0;
    	let dragging = false;
    	const dispatch = createEventDispatcher();

    	function handlePick(e) {
    		startX = e.clientX;
    		startY = e.clientY;
    		dragging = true;
    		dispatch("pick", {});
    	}

    	function handleDrop() {
    		$$invalidate(0, deltaX = 0);
    		$$invalidate(1, deltaY = 0);

    		if (dragging) {
    			dispatch("drop", {});
    		}

    		dragging = false;
    	}

    	function handleDrag(e) {
    		if (dragging) {
    			$$invalidate(0, deltaX = e.clientX - startX);
    			$$invalidate(1, deltaY = e.clientY - startY);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Draggable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		startX,
    		startY,
    		deltaX,
    		deltaY,
    		dragging,
    		dispatch,
    		handlePick,
    		handleDrop,
    		handleDrag
    	});

    	$$self.$inject_state = $$props => {
    		if ("startX" in $$props) startX = $$props.startX;
    		if ("startY" in $$props) startY = $$props.startY;
    		if ("deltaX" in $$props) $$invalidate(0, deltaX = $$props.deltaX);
    		if ("deltaY" in $$props) $$invalidate(1, deltaY = $$props.deltaY);
    		if ("dragging" in $$props) dragging = $$props.dragging;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [deltaX, deltaY, handlePick, handleDrop, handleDrag, $$scope, slots];
    }

    class Draggable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Draggable",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Cell.svelte generated by Svelte v3.37.0 */
    const file$3 = "src/components/Cell.svelte";

    // (24:2) {#if x === 0 || y === 0}
    function create_if_block_6(ctx) {
    	let div;
    	let t_value = coordsToAnno(/*x*/ ctx[3], /*y*/ ctx[4]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "anno svelte-1lw6xjq");

    			set_style(div, "color", /*x*/ ctx[3] % 2 === /*y*/ ctx[4] % 2
    			? "#fff1de"
    			: "#b58a59");

    			add_location(div, file$3, 24, 4, 630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*x, y*/ 24 && t_value !== (t_value = coordsToAnno(/*x*/ ctx[3], /*y*/ ctx[4]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*x, y*/ 24) {
    				set_style(div, "color", /*x*/ ctx[3] % 2 === /*y*/ ctx[4] % 2
    				? "#fff1de"
    				: "#b58a59");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(24:2) {#if x === 0 || y === 0}",
    		ctx
    	});

    	return block;
    }

    // (30:2) {#if showDebug}
    function create_if_block_5(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*id*/ ctx[2]);
    			attr_dev(div, "class", "debug svelte-1lw6xjq");
    			add_location(div, file$3, 30, 4, 775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*id*/ 4) set_data_dev(t, /*id*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(30:2) {#if showDebug}",
    		ctx
    	});

    	return block;
    }

    // (34:2) {#if highlight}
    function create_if_block_4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "overlay highlight svelte-1lw6xjq");
    			add_location(div, file$3, 34, 4, 836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(34:2) {#if highlight}",
    		ctx
    	});

    	return block;
    }

    // (38:2) {#if showBlocked && blocked}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "overlay blocked svelte-1lw6xjq");
    			add_location(div, file$3, 38, 4, 913);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(38:2) {#if showBlocked && blocked}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {#if visited}
    function create_if_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "overlay visited svelte-1lw6xjq");
    			add_location(div, file$3, 42, 4, 973);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(42:2) {#if visited}",
    		ctx
    	});

    	return block;
    }

    // (50:18) 
    function create_if_block_1(ctx) {
    	let piece_1;
    	let current;
    	const piece_1_spread_levels = [/*piece*/ ctx[5]];
    	let piece_1_props = {};

    	for (let i = 0; i < piece_1_spread_levels.length; i += 1) {
    		piece_1_props = assign(piece_1_props, piece_1_spread_levels[i]);
    	}

    	piece_1 = new Piece({ props: piece_1_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(piece_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(piece_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const piece_1_changes = (dirty & /*piece*/ 32)
    			? get_spread_update(piece_1_spread_levels, [get_spread_object(/*piece*/ ctx[5])])
    			: {};

    			piece_1.$set(piece_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(piece_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(piece_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(piece_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(50:18) ",
    		ctx
    	});

    	return block;
    }

    // (46:2) {#if piece && piece.player}
    function create_if_block(ctx) {
    	let draggable;
    	let current;

    	draggable = new Draggable({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	draggable.$on("pick", /*pick_handler*/ ctx[9]);
    	draggable.$on("drop", /*drop_handler*/ ctx[10]);

    	const block = {
    		c: function create() {
    			create_component(draggable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(draggable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const draggable_changes = {};

    			if (dirty & /*$$scope, piece*/ 2080) {
    				draggable_changes.$$scope = { dirty, ctx };
    			}

    			draggable.$set(draggable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(draggable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(draggable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(draggable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(46:2) {#if piece && piece.player}",
    		ctx
    	});

    	return block;
    }

    // (47:4) <Draggable on:pick on:drop>
    function create_default_slot(ctx) {
    	let piece_1;
    	let current;
    	const piece_1_spread_levels = [/*piece*/ ctx[5]];
    	let piece_1_props = {};

    	for (let i = 0; i < piece_1_spread_levels.length; i += 1) {
    		piece_1_props = assign(piece_1_props, piece_1_spread_levels[i]);
    	}

    	piece_1 = new Piece({ props: piece_1_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(piece_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(piece_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const piece_1_changes = (dirty & /*piece*/ 32)
    			? get_spread_update(piece_1_spread_levels, [get_spread_object(/*piece*/ ctx[5])])
    			: {};

    			piece_1.$set(piece_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(piece_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(piece_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(piece_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(47:4) <Draggable on:pick on:drop>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current_block_type_index;
    	let if_block5;
    	let current;
    	let if_block0 = (/*x*/ ctx[3] === 0 || /*y*/ ctx[4] === 0) && create_if_block_6(ctx);
    	let if_block1 = /*showDebug*/ ctx[1] && create_if_block_5(ctx);
    	let if_block2 = /*highlight*/ ctx[7] && create_if_block_4(ctx);
    	let if_block3 = /*showBlocked*/ ctx[0] && /*blocked*/ ctx[8] && create_if_block_3(ctx);
    	let if_block4 = /*visited*/ ctx[6] && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*piece*/ ctx[5] && /*piece*/ ctx[5].player) return 0;
    		if (/*piece*/ ctx[5]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block5 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			attr_dev(div, "class", "cell svelte-1lw6xjq");

    			set_style(div, "background", /*x*/ ctx[3] % 2 === /*y*/ ctx[4] % 2
    			? "#b58a59"
    			: "#fff1de");

    			add_location(div, file$3, 22, 0, 518);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			append_dev(div, t3);
    			if (if_block4) if_block4.m(div, null);
    			append_dev(div, t4);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*x*/ ctx[3] === 0 || /*y*/ ctx[4] === 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showDebug*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*highlight*/ ctx[7]) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*showBlocked*/ ctx[0] && /*blocked*/ ctx[8]) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_3(ctx);
    					if_block3.c();
    					if_block3.m(div, t3);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*visited*/ ctx[6]) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_2(ctx);
    					if_block4.c();
    					if_block4.m(div, t4);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block5) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block5 = if_blocks[current_block_type_index];

    					if (!if_block5) {
    						if_block5 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block5.c();
    					} else {
    						if_block5.p(ctx, dirty);
    					}

    					transition_in(if_block5, 1);
    					if_block5.m(div, null);
    				} else {
    					if_block5 = null;
    				}
    			}

    			if (!current || dirty & /*x, y*/ 24) {
    				set_style(div, "background", /*x*/ ctx[3] % 2 === /*y*/ ctx[4] % 2
    				? "#b58a59"
    				: "#fff1de");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block5);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block5);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function coordsToAnno(x, y) {
    	const xChar = String.fromCharCode(97 + x % 26);
    	const xCharCount = Math.floor(1 + x / 26);
    	return xChar.repeat(xCharCount) + (y + 1);
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Cell", slots, []);
    	let { showBlocked = false } = $$props;
    	let { showDebug = false } = $$props;
    	let { id } = $$props;
    	let { x } = $$props;
    	let { y } = $$props;
    	let { piece } = $$props;
    	let { visited = false } = $$props;
    	let { highlight = false } = $$props;
    	let { blocked = false } = $$props;

    	const writable_props = [
    		"showBlocked",
    		"showDebug",
    		"id",
    		"x",
    		"y",
    		"piece",
    		"visited",
    		"highlight",
    		"blocked"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cell> was created with unknown prop '${key}'`);
    	});

    	function pick_handler(event) {
    		bubble($$self, event);
    	}

    	function drop_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("showBlocked" in $$props) $$invalidate(0, showBlocked = $$props.showBlocked);
    		if ("showDebug" in $$props) $$invalidate(1, showDebug = $$props.showDebug);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    		if ("piece" in $$props) $$invalidate(5, piece = $$props.piece);
    		if ("visited" in $$props) $$invalidate(6, visited = $$props.visited);
    		if ("highlight" in $$props) $$invalidate(7, highlight = $$props.highlight);
    		if ("blocked" in $$props) $$invalidate(8, blocked = $$props.blocked);
    	};

    	$$self.$capture_state = () => ({
    		Piece,
    		Draggable,
    		showBlocked,
    		showDebug,
    		id,
    		x,
    		y,
    		piece,
    		visited,
    		highlight,
    		blocked,
    		coordsToAnno
    	});

    	$$self.$inject_state = $$props => {
    		if ("showBlocked" in $$props) $$invalidate(0, showBlocked = $$props.showBlocked);
    		if ("showDebug" in $$props) $$invalidate(1, showDebug = $$props.showDebug);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("x" in $$props) $$invalidate(3, x = $$props.x);
    		if ("y" in $$props) $$invalidate(4, y = $$props.y);
    		if ("piece" in $$props) $$invalidate(5, piece = $$props.piece);
    		if ("visited" in $$props) $$invalidate(6, visited = $$props.visited);
    		if ("highlight" in $$props) $$invalidate(7, highlight = $$props.highlight);
    		if ("blocked" in $$props) $$invalidate(8, blocked = $$props.blocked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showBlocked,
    		showDebug,
    		id,
    		x,
    		y,
    		piece,
    		visited,
    		highlight,
    		blocked,
    		pick_handler,
    		drop_handler
    	];
    }

    class Cell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			showBlocked: 0,
    			showDebug: 1,
    			id: 2,
    			x: 3,
    			y: 4,
    			piece: 5,
    			visited: 6,
    			highlight: 7,
    			blocked: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cell",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[2] === undefined && !("id" in props)) {
    			console.warn("<Cell> was created without expected prop 'id'");
    		}

    		if (/*x*/ ctx[3] === undefined && !("x" in props)) {
    			console.warn("<Cell> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[4] === undefined && !("y" in props)) {
    			console.warn("<Cell> was created without expected prop 'y'");
    		}

    		if (/*piece*/ ctx[5] === undefined && !("piece" in props)) {
    			console.warn("<Cell> was created without expected prop 'piece'");
    		}
    	}

    	get showBlocked() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showBlocked(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showDebug() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showDebug(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get piece() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set piece(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visited() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visited(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlight() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlight(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get blocked() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set blocked(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Board.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/components/Board.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (46:2) {#each Array(width) as _, x}
    function create_each_block_1(ctx) {
    	let div;
    	let cell;
    	let t;
    	let current;
    	let mounted;
    	let dispose;

    	const cell_spread_levels = [
    		/*tiles*/ ctx[4][/*coordsToIndex*/ ctx[5](/*x*/ ctx[20], /*y*/ ctx[15])],
    		{
    			id: /*coordsToIndex*/ ctx[5](/*x*/ ctx[20], /*y*/ ctx[15])
    		},
    		{ x: /*x*/ ctx[20] },
    		{ y: /*y*/ ctx[15] },
    		{ showBlocked: /*showBlocked*/ ctx[0] },
    		{ showDebug: /*showDebug*/ ctx[1] }
    	];

    	function drop_handler() {
    		return /*drop_handler*/ ctx[9](/*x*/ ctx[20], /*y*/ ctx[15]);
    	}

    	function pick_handler() {
    		return /*pick_handler*/ ctx[10](/*x*/ ctx[20], /*y*/ ctx[15]);
    	}

    	let cell_props = {};

    	for (let i = 0; i < cell_spread_levels.length; i += 1) {
    		cell_props = assign(cell_props, cell_spread_levels[i]);
    	}

    	cell = new Cell({ props: cell_props, $$inline: true });
    	cell.$on("drop", drop_handler);
    	cell.$on("pick", pick_handler);

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[11](/*x*/ ctx[20], /*y*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(cell.$$.fragment);
    			t = space();
    			add_location(div, file$2, 46, 4, 1166);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(cell, div, null);
    			append_dev(div, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "mouseenter", mouseenter_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const cell_changes = (dirty & /*tiles, coordsToIndex, Array, height, showBlocked, showDebug*/ 59)
    			? get_spread_update(cell_spread_levels, [
    					dirty & /*tiles, coordsToIndex, Array, height*/ 56 && get_spread_object(/*tiles*/ ctx[4][/*coordsToIndex*/ ctx[5](/*x*/ ctx[20], /*y*/ ctx[15])]),
    					dirty & /*coordsToIndex, Array, height*/ 40 && {
    						id: /*coordsToIndex*/ ctx[5](/*x*/ ctx[20], /*y*/ ctx[15])
    					},
    					cell_spread_levels[2],
    					dirty & /*Array, height*/ 8 && { y: /*y*/ ctx[15] },
    					dirty & /*showBlocked*/ 1 && { showBlocked: /*showBlocked*/ ctx[0] },
    					dirty & /*showDebug*/ 2 && { showDebug: /*showDebug*/ ctx[1] }
    				])
    			: {};

    			cell.$set(cell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(cell);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(46:2) {#each Array(width) as _, x}",
    		ctx
    	});

    	return block;
    }

    // (45:2) {#each Array.from(Array(height).keys()).reverse() as y}
    function create_each_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = Array(/*width*/ ctx[2]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*handleHover, coordsToIndex, Array, height, tiles, showBlocked, showDebug, handleDrop, handlePick, width*/ 511) {
    				each_value_1 = Array(/*width*/ ctx[2]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(45:2) {#each Array.from(Array(height).keys()).reverse() as y}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Array.from(Array(/*height*/ ctx[3]).keys()).reverse();
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "base svelte-1li6ah3");
    			set_style(div, "grid-template-columns", "repeat(" + /*width*/ ctx[2] + ", 80px [col-start])");
    			set_style(div, "grid-template-rows", "repeat(" + /*height*/ ctx[3] + ", 80px [col-start])");
    			add_location(div, file$2, 38, 0, 855);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Array, width, handleHover, coordsToIndex, height, tiles, showBlocked, showDebug, handleDrop, handlePick*/ 511) {
    				each_value = Array.from(Array(/*height*/ ctx[3]).keys()).reverse();
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*width*/ 4) {
    				set_style(div, "grid-template-columns", "repeat(" + /*width*/ ctx[2] + ", 80px [col-start])");
    			}

    			if (!current || dirty & /*height*/ 8) {
    				set_style(div, "grid-template-rows", "repeat(" + /*height*/ ctx[3] + ", 80px [col-start])");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Board", slots, []);
    	let { showBlocked = false } = $$props;
    	let { showDebug = false } = $$props;
    	let { width = 8 } = $$props;
    	let { height = 8 } = $$props;

    	let { tiles = Array(width * height).fill().map(() => ({
    		blocked: false,
    		highlight: false,
    		piece: undefined,
    		highlight: "red"
    	})) } = $$props;

    	let hoveringTile;
    	const dispatch = createEventDispatcher();

    	// ========= Utils
    	function coordsToIndex(x, y) {
    		return x + y * width;
    	}

    	// ========= Handlers
    	function handlePick(onTile) {
    		dispatch("pick", { from: onTile });
    	}

    	function handleDrop(onTile) {
    		if (hoveringTile != null) {
    			dispatch("drop", { from: onTile, to: hoveringTile });
    		}
    	}

    	function handleHover(onTile) {
    		hoveringTile = onTile;
    		dispatch("hover", { over: hoveringTile });
    	}

    	const writable_props = ["showBlocked", "showDebug", "width", "height", "tiles"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	const drop_handler = (x, y) => handleDrop(coordsToIndex(x, y));
    	const pick_handler = (x, y) => handlePick(coordsToIndex(x, y));
    	const mouseenter_handler = (x, y) => handleHover(coordsToIndex(x, y));
    	const mouseleave_handler = () => handleHover(undefined);

    	$$self.$$set = $$props => {
    		if ("showBlocked" in $$props) $$invalidate(0, showBlocked = $$props.showBlocked);
    		if ("showDebug" in $$props) $$invalidate(1, showDebug = $$props.showDebug);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    		if ("tiles" in $$props) $$invalidate(4, tiles = $$props.tiles);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Cell,
    		showBlocked,
    		showDebug,
    		width,
    		height,
    		tiles,
    		hoveringTile,
    		dispatch,
    		coordsToIndex,
    		handlePick,
    		handleDrop,
    		handleHover
    	});

    	$$self.$inject_state = $$props => {
    		if ("showBlocked" in $$props) $$invalidate(0, showBlocked = $$props.showBlocked);
    		if ("showDebug" in $$props) $$invalidate(1, showDebug = $$props.showDebug);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    		if ("tiles" in $$props) $$invalidate(4, tiles = $$props.tiles);
    		if ("hoveringTile" in $$props) hoveringTile = $$props.hoveringTile;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showBlocked,
    		showDebug,
    		width,
    		height,
    		tiles,
    		coordsToIndex,
    		handlePick,
    		handleDrop,
    		handleHover,
    		drop_handler,
    		pick_handler,
    		mouseenter_handler,
    		mouseleave_handler
    	];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			showBlocked: 0,
    			showDebug: 1,
    			width: 2,
    			height: 3,
    			tiles: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get showBlocked() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showBlocked(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showDebug() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showDebug(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tiles() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tiles(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Sidebar.svelte generated by Svelte v3.37.0 */
    const file$1 = "src/components/Sidebar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	child_ctx[15] = i;
    	return child_ctx;
    }

    // (79:6) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Make a move!\n      ";
    			add_location(p, file$1, 79, 6, 1662);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(79:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:4) {#each moves as m, i}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*m*/ ctx[13] + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(/*i*/ ctx[15]);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(td0, "class", "svelte-1j53bl1");
    			add_location(td0, file$1, 75, 8, 1596);
    			attr_dev(td1, "class", "svelte-1j53bl1");
    			add_location(td1, file$1, 76, 8, 1617);
    			add_location(tr, file$1, 74, 6, 1583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*moves*/ 4 && t2_value !== (t2_value = /*m*/ ctx[13] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(74:4) {#each moves as m, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div4;
    	let div0;
    	let label0;
    	let input0;
    	let t0;
    	let t1;
    	let div1;
    	let label1;
    	let input1;
    	let t2;
    	let t3;
    	let button;
    	let t5;
    	let p0;
    	let b0;
    	let t7;
    	let t8_value = millisecondsToTime(/*currentTime*/ ctx[6] - /*startTime*/ ctx[3]) + "";
    	let t8;
    	let t9;
    	let p1;
    	let b1;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let table;
    	let thead;
    	let th0;
    	let div2;
    	let t15;
    	let th1;
    	let div3;
    	let t17;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*moves*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = text("\n      Show debug");
    			t1 = space();
    			div1 = element("div");
    			label1 = element("label");
    			input1 = element("input");
    			t2 = text("\n      Show blocked squares");
    			t3 = space();
    			button = element("button");
    			button.textContent = "Reset";
    			t5 = space();
    			p0 = element("p");
    			b0 = element("b");
    			b0.textContent = "Time taken:";
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			p1 = element("p");
    			b1 = element("b");
    			t10 = text("Moves (");
    			t11 = text(/*count*/ ctx[5]);
    			t12 = text("):");
    			t13 = space();
    			table = element("table");
    			thead = element("thead");
    			th0 = element("th");
    			div2 = element("div");
    			div2.textContent = "id";
    			t15 = space();
    			th1 = element("th");
    			div3 = element("div");
    			div3.textContent = "to";
    			t17 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$1, 47, 6, 1012);
    			add_location(label0, file$1, 46, 4, 998);
    			add_location(div0, file$1, 45, 2, 988);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$1, 53, 6, 1124);
    			add_location(label1, file$1, 52, 4, 1110);
    			add_location(div1, file$1, 51, 2, 1100);
    			add_location(button, file$1, 58, 2, 1225);
    			add_location(b0, file$1, 61, 4, 1282);
    			add_location(p0, file$1, 60, 2, 1274);
    			add_location(b1, file$1, 64, 4, 1365);
    			add_location(p1, file$1, 63, 2, 1357);
    			add_location(div2, file$1, 69, 21, 1441);
    			attr_dev(th0, "class", "id svelte-1j53bl1");
    			add_location(th0, file$1, 69, 6, 1426);
    			add_location(div3, file$1, 70, 21, 1481);
    			attr_dev(th1, "class", "to svelte-1j53bl1");
    			add_location(th1, file$1, 70, 6, 1466);
    			attr_dev(thead, "class", "svelte-1j53bl1");
    			add_location(thead, file$1, 68, 4, 1412);
    			attr_dev(tbody, "class", "svelte-1j53bl1");
    			add_location(tbody, file$1, 72, 4, 1517);
    			attr_dev(table, "class", "svelte-1j53bl1");
    			add_location(table, file$1, 67, 2, 1400);
    			attr_dev(div4, "class", "container svelte-1j53bl1");
    			add_location(div4, file$1, 44, 0, 962);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, label0);
    			append_dev(label0, input0);
    			input0.checked = /*showDebug*/ ctx[0];
    			append_dev(label0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div1, label1);
    			append_dev(label1, input1);
    			input1.checked = /*showBlocked*/ ctx[1];
    			append_dev(label1, t2);
    			append_dev(div4, t3);
    			append_dev(div4, button);
    			append_dev(div4, t5);
    			append_dev(div4, p0);
    			append_dev(p0, b0);
    			append_dev(p0, t7);
    			append_dev(p0, t8);
    			append_dev(div4, t9);
    			append_dev(div4, p1);
    			append_dev(p1, b1);
    			append_dev(b1, t10);
    			append_dev(b1, t11);
    			append_dev(b1, t12);
    			append_dev(div4, t13);
    			append_dev(div4, table);
    			append_dev(table, thead);
    			append_dev(thead, th0);
    			append_dev(th0, div2);
    			append_dev(thead, t15);
    			append_dev(thead, th1);
    			append_dev(th1, div3);
    			append_dev(table, t17);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(tbody, null);
    			}

    			/*tbody_binding*/ ctx[11](tbody);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[9]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[10]),
    					listen_dev(button, "click", /*handleReset*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*showDebug*/ 1) {
    				input0.checked = /*showDebug*/ ctx[0];
    			}

    			if (dirty & /*showBlocked*/ 2) {
    				input1.checked = /*showBlocked*/ ctx[1];
    			}

    			if (dirty & /*currentTime, startTime*/ 72 && t8_value !== (t8_value = millisecondsToTime(/*currentTime*/ ctx[6] - /*startTime*/ ctx[3]) + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*count*/ 32) set_data_dev(t11, /*count*/ ctx[5]);

    			if (dirty & /*moves*/ 4) {
    				each_value = /*moves*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(tbody, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    			/*tbody_binding*/ ctx[11](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function millisecondsToTime(milli) {
    	const seconds = Math.max(0, Math.floor(milli / 1000 % 60));
    	const minutes = Math.max(0, Math.floor(milli / (60 * 1000) % 60));
    	return `${minutes}m ${seconds}s `;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sidebar", slots, []);
    	let { showDebug = false } = $$props;
    	let { showBlocked = false } = $$props;
    	let { moves = [] } = $$props;
    	let { startTime = 0 } = $$props;
    	let { stopped = false } = $$props;
    	let currentTime = startTime;
    	let scrollSection;
    	let count;
    	const dispatch = createEventDispatcher();

    	onMount(() => {
    		setInterval(
    			() => {
    				if (!stopped) {
    					$$invalidate(6, currentTime = Date.now());
    				}
    			},
    			10
    		);
    	});

    	function handleReset() {
    		dispatch("reset", {});
    	}

    	const writable_props = ["showDebug", "showBlocked", "moves", "startTime", "stopped"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		showDebug = this.checked;
    		$$invalidate(0, showDebug);
    	}

    	function input1_change_handler() {
    		showBlocked = this.checked;
    		$$invalidate(1, showBlocked);
    	}

    	function tbody_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			scrollSection = $$value;
    			$$invalidate(4, scrollSection);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("showDebug" in $$props) $$invalidate(0, showDebug = $$props.showDebug);
    		if ("showBlocked" in $$props) $$invalidate(1, showBlocked = $$props.showBlocked);
    		if ("moves" in $$props) $$invalidate(2, moves = $$props.moves);
    		if ("startTime" in $$props) $$invalidate(3, startTime = $$props.startTime);
    		if ("stopped" in $$props) $$invalidate(8, stopped = $$props.stopped);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		showDebug,
    		showBlocked,
    		moves,
    		startTime,
    		stopped,
    		currentTime,
    		scrollSection,
    		count,
    		dispatch,
    		handleReset,
    		millisecondsToTime
    	});

    	$$self.$inject_state = $$props => {
    		if ("showDebug" in $$props) $$invalidate(0, showDebug = $$props.showDebug);
    		if ("showBlocked" in $$props) $$invalidate(1, showBlocked = $$props.showBlocked);
    		if ("moves" in $$props) $$invalidate(2, moves = $$props.moves);
    		if ("startTime" in $$props) $$invalidate(3, startTime = $$props.startTime);
    		if ("stopped" in $$props) $$invalidate(8, stopped = $$props.stopped);
    		if ("currentTime" in $$props) $$invalidate(6, currentTime = $$props.currentTime);
    		if ("scrollSection" in $$props) $$invalidate(4, scrollSection = $$props.scrollSection);
    		if ("count" in $$props) $$invalidate(5, count = $$props.count);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*moves, scrollSection, count*/ 52) {
    			{
    				$$invalidate(5, count = moves.length);

    				if (scrollSection) {
    					setTimeout(
    						() => {
    							scrollSection.scrollTo(0, scrollSection.scrollHeight);
    						},
    						1
    					);
    				}
    			}
    		}
    	};

    	return [
    		showDebug,
    		showBlocked,
    		moves,
    		startTime,
    		scrollSection,
    		count,
    		currentTime,
    		handleReset,
    		stopped,
    		input0_change_handler,
    		input1_change_handler,
    		tbody_binding
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			showDebug: 0,
    			showBlocked: 1,
    			moves: 2,
    			startTime: 3,
    			stopped: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get showDebug() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showDebug(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showBlocked() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showBlocked(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get moves() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set moves(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startTime() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startTime(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stopped() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stopped(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let br0;
    	let t2;
    	let div2;
    	let div0;
    	let board;
    	let t3;
    	let div1;
    	let sidebar;
    	let updating_showDebug;
    	let updating_showBlocked;
    	let t4;
    	let footer;
    	let div3;
    	let p0;
    	let t6;
    	let ul;
    	let li0;
    	let t8;
    	let li1;
    	let t10;
    	let li2;
    	let t12;
    	let li3;
    	let t14;
    	let p1;
    	let t15;
    	let a0;
    	let t17;
    	let a1;
    	let t19;
    	let t20;
    	let br1;
    	let current;

    	board = new Board({
    			props: {
    				tiles: /*tiles*/ ctx[0],
    				width: /*width*/ ctx[6],
    				height: /*height*/ ctx[7],
    				showBlocked: /*showBlocked*/ ctx[4],
    				showDebug: /*showDebug*/ ctx[5]
    			},
    			$$inline: true
    		});

    	board.$on("pick", handlePick);
    	board.$on("drop", /*handleDrop*/ ctx[9]);
    	board.$on("hover", handleHover);

    	function sidebar_showDebug_binding(value) {
    		/*sidebar_showDebug_binding*/ ctx[10](value);
    	}

    	function sidebar_showBlocked_binding(value) {
    		/*sidebar_showBlocked_binding*/ ctx[11](value);
    	}

    	let sidebar_props = {
    		startTime: /*startTime*/ ctx[2],
    		stopped: /*stopped*/ ctx[3],
    		moves: /*moves*/ ctx[1]
    	};

    	if (/*showDebug*/ ctx[5] !== void 0) {
    		sidebar_props.showDebug = /*showDebug*/ ctx[5];
    	}

    	if (/*showBlocked*/ ctx[4] !== void 0) {
    		sidebar_props.showBlocked = /*showBlocked*/ ctx[4];
    	}

    	sidebar = new Sidebar({ props: sidebar_props, $$inline: true });
    	binding_callbacks.push(() => bind(sidebar, "showDebug", sidebar_showDebug_binding));
    	binding_callbacks.push(() => bind(sidebar, "showBlocked", sidebar_showBlocked_binding));
    	sidebar.$on("reset", /*handleReset*/ ctx[8]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "♘ Knight and Queen Puzzle ♕";
    			t1 = space();
    			br0 = element("br");
    			t2 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(board.$$.fragment);
    			t3 = space();
    			div1 = element("div");
    			create_component(sidebar.$$.fragment);
    			t4 = space();
    			footer = element("footer");
    			div3 = element("div");
    			p0 = element("p");
    			p0.textContent = "This is an exercise to challenge your knight maneuvering skills in Chess!";
    			t6 = text("\n\t\tRules:\n\t\t");
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Touch every possible square with the white knight (♘)";
    			t8 = space();
    			li1 = element("li");
    			li1.textContent = "Without moving into an attacked square (☠)";
    			t10 = space();
    			li2 = element("li");
    			li2.textContent = "Without capturing the black queen (♛)";
    			t12 = space();
    			li3 = element("li");
    			li3.textContent = "Starting from right to left (⬅️), top to bottom (⬇️)";
    			t14 = space();
    			p1 = element("p");
    			t15 = text("Built by\t");
    			a0 = element("a");
    			a0.textContent = "Mark Connelly";
    			t17 = text("\n\t\t\tinspired by ");
    			a1 = element("a");
    			a1.textContent = "Ben Finegold";
    			t19 = text("\n\t\t\ton YouTube.");
    			t20 = space();
    			br1 = element("br");
    			attr_dev(h1, "class", "svelte-5fosnp");
    			add_location(h1, file, 135, 1, 3320);
    			add_location(br0, file, 136, 1, 3358);
    			attr_dev(div0, "class", "container svelte-5fosnp");
    			add_location(div0, file, 139, 2, 3389);
    			attr_dev(div1, "class", "sidebar svelte-5fosnp");
    			add_location(div1, file, 151, 2, 3580);
    			attr_dev(div2, "class", "content svelte-5fosnp");
    			add_location(div2, file, 137, 1, 3364);
    			attr_dev(main, "class", "svelte-5fosnp");
    			add_location(main, file, 134, 0, 3312);
    			add_location(p0, file, 159, 2, 3770);
    			add_location(li0, file, 164, 3, 3877);
    			add_location(li1, file, 165, 3, 3943);
    			add_location(li2, file, 166, 3, 3998);
    			add_location(li3, file, 167, 3, 4048);
    			add_location(ul, file, 163, 2, 3869);
    			attr_dev(a0, "href", "https://github.com/plasmatech8/KnightAndQueenPuzzle");
    			add_location(a0, file, 170, 12, 4136);
    			attr_dev(a1, "href", "https://www.youtube.com/watch?v=SrQlpY_eGYU");
    			add_location(a1, file, 171, 15, 4231);
    			add_location(p1, file, 169, 2, 4120);
    			attr_dev(div3, "class", "footbox svelte-5fosnp");
    			add_location(div3, file, 158, 1, 3746);
    			add_location(br1, file, 175, 1, 4333);
    			add_location(footer, file, 157, 0, 3736);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, br0);
    			append_dev(main, t2);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			mount_component(board, div0, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			mount_component(sidebar, div1, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div3);
    			append_dev(div3, p0);
    			append_dev(div3, t6);
    			append_dev(div3, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t8);
    			append_dev(ul, li1);
    			append_dev(ul, t10);
    			append_dev(ul, li2);
    			append_dev(ul, t12);
    			append_dev(ul, li3);
    			append_dev(div3, t14);
    			append_dev(div3, p1);
    			append_dev(p1, t15);
    			append_dev(p1, a0);
    			append_dev(p1, t17);
    			append_dev(p1, a1);
    			append_dev(p1, t19);
    			append_dev(footer, t20);
    			append_dev(footer, br1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const board_changes = {};
    			if (dirty & /*tiles*/ 1) board_changes.tiles = /*tiles*/ ctx[0];
    			if (dirty & /*showBlocked*/ 16) board_changes.showBlocked = /*showBlocked*/ ctx[4];
    			if (dirty & /*showDebug*/ 32) board_changes.showDebug = /*showDebug*/ ctx[5];
    			board.$set(board_changes);
    			const sidebar_changes = {};
    			if (dirty & /*startTime*/ 4) sidebar_changes.startTime = /*startTime*/ ctx[2];
    			if (dirty & /*stopped*/ 8) sidebar_changes.stopped = /*stopped*/ ctx[3];
    			if (dirty & /*moves*/ 2) sidebar_changes.moves = /*moves*/ ctx[1];

    			if (!updating_showDebug && dirty & /*showDebug*/ 32) {
    				updating_showDebug = true;
    				sidebar_changes.showDebug = /*showDebug*/ ctx[5];
    				add_flush_callback(() => updating_showDebug = false);
    			}

    			if (!updating_showBlocked && dirty & /*showBlocked*/ 16) {
    				updating_showBlocked = true;
    				sidebar_changes.showBlocked = /*showBlocked*/ ctx[4];
    				add_flush_callback(() => updating_showBlocked = false);
    			}

    			sidebar.$set(sidebar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(board.$$.fragment, local);
    			transition_in(sidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(board.$$.fragment, local);
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(board);
    			destroy_component(sidebar);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handlePick(e) {
    	
    } //console.log('pick', e.detail.from)

    function handleHover(e) {
    	
    } //console.log('hover', e.detail.over)

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let width = 8;
    	let height = 8;

    	let tiles = Array(width * height).fill().map(() => ({
    		blocked: false,
    		highlight: false,
    		visited: false,
    		piece: undefined
    	}));

    	let target = 61;
    	let moves = [];
    	let startTime = Date.now();
    	let stopped = true;
    	let showBlocked = false;
    	let showDebug = false;
    	const knightMoveDeltas = [-15, 15, -17, 17, -10, 10, -6, 6];
    	onMount(initBoard);

    	function initBoard() {
    		// Initialise tiles, moves, and play sound effect
    		$$invalidate(0, tiles = Array(width * height).fill().map(() => ({
    			blocked: false,
    			highlight: false,
    			visited: false,
    			piece: undefined
    		})));

    		target = 61;
    		$$invalidate(1, moves = []);
    		$$invalidate(2, startTime = Date.now());
    		$$invalidate(3, stopped = true);

    		// Queen
    		$$invalidate(
    			0,
    			tiles[35].piece = {
    				color: "black",
    				type: "queen",
    				player: false
    			},
    			tiles
    		);

    		// Queen blocked tiles
    		for (let i = 0; i < 8; i++) {
    			$$invalidate(0, tiles[32 + i].blocked = true, tiles);
    			$$invalidate(0, tiles[3 + i * 8].blocked = true, tiles);
    		}

    		for (let i = 0; i < 7; i++) {
    			$$invalidate(0, tiles[8 + i * 9].blocked = true, tiles);
    		}

    		for (let i = 0; i < 8; i++) {
    			$$invalidate(0, tiles[7 + i * 7].blocked = true, tiles);
    		}

    		// Knight
    		$$invalidate(
    			0,
    			tiles[63].piece = {
    				color: "white",
    				type: "knight",
    				player: true
    			},
    			tiles
    		);

    		$$invalidate(0, tiles[61].highlight = true, tiles);
    		$$invalidate(0, tiles[63].visited = true, tiles);
    		$$invalidate(0, tiles[62].visited = true, tiles);
    	}

    	function handleReset(e) {
    		new Audio("./sounds/Select.ogg").play();
    		initBoard();
    	}

    	function indexToAnno(id) {
    		const y = Math.floor(id / width);
    		const x = id % width;
    		const xChar = String.fromCharCode(97 + x % 26);
    		const xCharCount = Math.floor(1 + x / 26);
    		return xChar.repeat(xCharCount) + (y + 1);
    	}

    	function handleDrop(e) {
    		//console.log('drop', e.detail.from, e.detail.to)
    		const piece = tiles[e.detail.from].piece;

    		const blocked = tiles[e.detail.to].blocked;

    		// Idle
    		if (e.detail.from === e.detail.to) {
    			return;
    		}

    		// Blocked
    		if (blocked) {
    			new Audio("./sounds/Error.ogg").play();
    			console.info("%cblocked!", "font-weight: bold;");
    			return;
    		}

    		// Valid move
    		if (knightMoveDeltas.includes(e.detail.from - e.detail.to)) {
    			// Start timer
    			if (moves.length === 0) {
    				$$invalidate(2, startTime = Date.now());
    				$$invalidate(3, stopped = false);
    			}

    			// Relocate the piece
    			new Audio("./sounds/Move.ogg").play();

    			$$invalidate(0, tiles[e.detail.from].piece = undefined, tiles);
    			$$invalidate(0, tiles[e.detail.to].piece = piece, tiles);
    			$$invalidate(1, moves = [...moves, indexToAnno(e.detail.to)]);

    			// On target square
    			if (e.detail.to === target) {
    				$$invalidate(1, moves[moves.length - 1] += " ✔️", moves);
    				$$invalidate(0, tiles[e.detail.to].highlight = false, tiles);
    				$$invalidate(0, tiles[target].visited = true, tiles);

    				while (target > 0) {
    					target -= 1;

    					if (tiles[target].blocked) {
    						// Blocked - continue to next square
    						$$invalidate(0, tiles[target].visited = true, tiles);
    					} else {
    						// Target - found next valid target square
    						$$invalidate(0, tiles[target].highlight = true, tiles);

    						console.info(`%cnext target is ${target}!`, "font-weight: bold;");
    						return;
    					}
    				}

    				// Victory - no more targets
    				new Audio("./sounds/Victory.ogg").play();

    				$$invalidate(1, moves[moves.length - 1] += " 🏆", moves);
    				$$invalidate(3, stopped = true);
    			}

    			return;
    		}

    		// Invalid move
    		console.info("%cinvalid move", "font-weight: bold;");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function sidebar_showDebug_binding(value) {
    		showDebug = value;
    		$$invalidate(5, showDebug);
    	}

    	function sidebar_showBlocked_binding(value) {
    		showBlocked = value;
    		$$invalidate(4, showBlocked);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Board,
    		Sidebar,
    		width,
    		height,
    		tiles,
    		target,
    		moves,
    		startTime,
    		stopped,
    		showBlocked,
    		showDebug,
    		knightMoveDeltas,
    		initBoard,
    		handleReset,
    		indexToAnno,
    		handlePick,
    		handleDrop,
    		handleHover
    	});

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(6, width = $$props.width);
    		if ("height" in $$props) $$invalidate(7, height = $$props.height);
    		if ("tiles" in $$props) $$invalidate(0, tiles = $$props.tiles);
    		if ("target" in $$props) target = $$props.target;
    		if ("moves" in $$props) $$invalidate(1, moves = $$props.moves);
    		if ("startTime" in $$props) $$invalidate(2, startTime = $$props.startTime);
    		if ("stopped" in $$props) $$invalidate(3, stopped = $$props.stopped);
    		if ("showBlocked" in $$props) $$invalidate(4, showBlocked = $$props.showBlocked);
    		if ("showDebug" in $$props) $$invalidate(5, showDebug = $$props.showDebug);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		tiles,
    		moves,
    		startTime,
    		stopped,
    		showBlocked,
    		showDebug,
    		width,
    		height,
    		handleReset,
    		handleDrop,
    		sidebar_showDebug_binding,
    		sidebar_showBlocked_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
