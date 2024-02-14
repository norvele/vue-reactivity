const targetsMap = new WeakMap()
let activeEffect = null

function track(target, key) {
    if (!activeEffect) {
        return
    }
    if (!targetsMap.has(target)) {
        targetsMap.set(target, new Map())
    }
    const targetKeysMap = targetsMap.get(target)
    if (!targetKeysMap.has(key)) {
        targetKeysMap.set(key, new Set())
    }
    const effectsSet = targetKeysMap.get(key)
    effectsSet.add(activeEffect)
}

function trigger(target, key) {
    if (!targetsMap.has(target)) {
        return
    }
    const targetKeysMap = targetsMap.get(target)
    if (!targetKeysMap.has(key)) {
        return
    }
    targetKeysMap.get(key).forEach(effect => effect())
}

function effect(callback) {
    activeEffect = callback
    activeEffect()
    activeEffect = null
}

function reactive(obj) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            const result = Reflect.get(target, key, receiver)
            track(target, key)
            return result
        },
        set(target, key, newValue, receiver) {
            const result = Reflect.set(target, key, receiver)
            trigger(target, key)
            return result
        }
    })
}

function ref(initialValue) {
    return {
        _value: initialValue,
        get value() {
            track(this, 'value')
            return this._value
        },
        set value(newValue) {
            this._value = newValue
            trigger(this, 'value')
        }
    }
}

function computed(callback) {
    const result = ref()
    effect(() => {
        result.value = callback()
    })
    return result
}

function watch(ref, callback) {
    let oldValue = ref.value
    effect(() => {
        const newValue = ref.value
        callback(newValue, oldValue)
        oldValue = newValue
    })
}