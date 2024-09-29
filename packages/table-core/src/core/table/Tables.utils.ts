import { table_getPaginatedRowModel } from '../../features/row-pagination/RowPagination.utils'
import { functionalUpdate } from '../../utils'
import { createCoreRowModel } from './createCoreRowModel'
import type { RowData, Updater } from '../../types/type-utils'
import type { TableFeatures } from '../../types/TableFeatures'
import type { RowModel } from '../../types/RowModel'
import type { Table_Internal } from '../../types/Table'
import type { TableOptions } from '../../types/TableOptions'
import type { TableState } from '../../types/TableState'

export function table_reset<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>): void {
  table_setState(table, table.initialState)
}

export function table_mergeOptions<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table_Internal<TFeatures, TData>,
  newOptions: TableOptions<TFeatures, TData>,
) {
  if (table.options.mergeOptions) {
    return table.options.mergeOptions(table.options, newOptions)
  }

  return {
    ...table.options,
    ...newOptions,
  }
}

export function table_setOptions<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table_Internal<TFeatures, TData>,
  updater: Updater<TableOptions<TFeatures, TData>>,
): void {
  const newOptions = functionalUpdate(updater, table.options)
  table.options = table_mergeOptions(table, newOptions)
}

export function table_getInitialState<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>): TableState<TFeatures> {
  return structuredClone(table.initialState)
}

export function table_getState<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>): TableState<TFeatures> {
  return table.options.state as TableState<TFeatures>
}

export function table_setState<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table_Internal<TFeatures, TData>,
  updater: Updater<TableState<TFeatures>>,
): void {
  table.options.onStateChange?.(updater)
}

export function table_getCoreRowModel<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>): RowModel<TFeatures, TData> {
  if (!table._rowModels.Core) {
    table._rowModels.Core =
      table.options._rowModels?.Core?.(table) ??
      createCoreRowModel<TFeatures, TData>()(table)
  }

  return table._rowModels.Core()
}

export function table_getRowModel<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>): RowModel<TFeatures, TData> {
  return table_getPaginatedRowModel(table)
}
