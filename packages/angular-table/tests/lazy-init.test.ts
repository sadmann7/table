import { describe, expect, test, vi } from 'vitest'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { lazyInit } from '../src/lazy-signal-initializer'
import { flushQueue, setFixtureSignalInputs } from './test-utils'
import type { WritableSignal } from '@angular/core'

describe('lazyInit', () => {
  test('should init lazily in next tick when not accessing manually', async () => {
    const mockFn = vi.fn()

    TestBed.runInInjectionContext(() => {
      lazyInit(() => {
        mockFn()
        return {
          data: signal(true),
        }
      })
    })

    expect(mockFn).not.toHaveBeenCalled()

    await new Promise(setImmediate)

    expect(mockFn).toHaveBeenCalled()
  })

  test('should init eagerly accessing manually', () => {
    const mockFn = vi.fn()

    TestBed.runInInjectionContext(() => {
      const lazySignal = lazyInit(() => {
        mockFn()
        return {
          data: signal(true),
        }
      })

      lazySignal.data()
    })

    expect(mockFn).toHaveBeenCalled()
  })

  test('should init lazily and only once', async () => {
    const initCallFn = vi.fn()
    const registerDataValue = vi.fn<(arg0: number) => void>()

    let value!: { data: WritableSignal<number> }
    const outerSignal = signal(0)

    TestBed.runInInjectionContext(() => {
      value = lazyInit(() => {
        initCallFn()

        void outerSignal()

        return { data: signal(0) }
      })

      effect(() => registerDataValue(value.data()))
    })

    value.data()

    await flushQueue()

    expect(outerSignal).toBeDefined()

    expect(initCallFn).toHaveBeenCalledTimes(1)

    outerSignal.set(1)
    await flushQueue()
    outerSignal.set(2)
    await flushQueue()
    value.data.set(4)
    await flushQueue()

    expect(initCallFn).toHaveBeenCalledTimes(1)
    expect(registerDataValue).toHaveBeenCalledTimes(1)
  })

  test('should support required signal input', async () => {
    @Component({
      standalone: true,
      template: `{{ call }} - {{ lazySignal.data() }}`,
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Test {
      readonly title = input.required<string>()
      call = 0

      lazySignal = lazyInit(() => {
        this.call++
        return {
          data: computed(() => this.title()),
        }
      })
    }

    const fixture = TestBed.createComponent(Test)

    setFixtureSignalInputs(fixture, { title: 'newValue' })
    expect(fixture.debugElement.nativeElement.textContent).toBe('0 - newValue')
    await flushQueue()

    setFixtureSignalInputs(fixture, { title: 'updatedValue' })
    expect(fixture.debugElement.nativeElement.textContent).toBe(
      '1 - updatedValue',
    )

    setFixtureSignalInputs(fixture, { title: 'newUpdatedValue' })
    expect(fixture.debugElement.nativeElement.textContent).toBe(
      '1 - newUpdatedValue',
    )
  })
})
