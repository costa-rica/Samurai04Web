"use client";
import React, { useState, useMemo } from "react";
import {
	useReactTable,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	flexRender,
	createColumnHelper,
	SortingState,
	PaginationState,
} from "@tanstack/react-table";
import Link from "next/link";
import type { Article } from "@/types/article";
import ColumnVisibilityDropdown from "./ColumnVisibilityDropdown";
import { LoadingDots } from "../common/LoadingDots";

// Create columnHelper outside component for stable reference
const columnHelper = createColumnHelper<Article>();

interface TableReviewArticlesProps {
	data: Article[];
	selectedRowId?: number | null;
	loading?: boolean;

	// Column visibility options
	showReviewedColumn?: boolean;
	showRelevantColumn?: boolean;
	showDeleteColumn?: boolean;

	// Handlers
	onSelectArticle?: (article: Article) => void;
	onToggleReviewed?: (articleId: number) => void;
	onToggleRelevant?: (articleId: number) => void;
	onDeleteArticle?: (article: Article) => void;
}

const TableReviewArticles: React.FC<TableReviewArticlesProps> = ({
	data,
	selectedRowId = null,
	loading = false,
	showReviewedColumn = false,
	showRelevantColumn = false,
	showDeleteColumn = false,
	onSelectArticle,
	onToggleReviewed,
	onToggleRelevant,
	onDeleteArticle,
}) => {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [columnVisibility, setColumnVisibility] = useState({});

	const columns = useMemo(
		() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const allColumns: any[] = [
				columnHelper.accessor("id", {
					header: "ID",
					enableSorting: true,
					cell: ({ row }) => (
						<button
							onClick={() => onSelectArticle?.(row.original)}
							className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
						>
							{row.original.id}
						</button>
					),
				}),
			];

			// Conditionally add Watched column
			if (showReviewedColumn) {
				allColumns.push(
					columnHelper.accessor("isBeingReviewed", {
						header: "Watched ?",
						enableSorting: true,
						cell: ({ getValue, row }) => (
							<div className="flex justify-center">
								<button
									className={`px-2 py-1 text-xs rounded transition-opacity ${
										getValue() === false ? "opacity-50" : ""
									}`}
									onClick={() => onToggleReviewed?.(row.original.id)}
								>
									{getValue() === true ? "Yes" : "No"}
								</button>
							</div>
						),
					})
				);
			}

			// Add common columns
			allColumns.push(
			columnHelper.accessor("title", {
				header: "Title",
				enableSorting: true,
			}),
			columnHelper.accessor("description", {
				header: "Description",
				enableSorting: true,
				cell: ({ getValue }) => (
					<div className="text-xs">
						{getValue() && getValue().slice(0, 100)}
					</div>
				),
			}),
			columnHelper.accessor("publishedDate", {
				header: "Published Date",
				enableSorting: true,
			}),
			columnHelper.accessor("url", {
				header: "URL",
				enableSorting: true,
				cell: ({ getValue }) => {
					const rawUrl = getValue();
					if (!rawUrl) return null;

					const strippedUrl = rawUrl
						.replace(/^https?:\/\//, "")
						.replace(/^www\./, "");

					return (
						<div className="text-xs relative group">
							<Link
								href={rawUrl}
								target="_blank"
								className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
							>
								{strippedUrl.slice(0, 20)}
							</Link>
							<span className="invisible group-hover:visible absolute left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded z-10 whitespace-nowrap">
								{rawUrl}
							</span>
						</div>
					);
				},
			}),
			columnHelper.accessor("statesStringCommaSeparated", {
				header: "State",
				enableSorting: true,
			})
			);

			// Conditionally add Relevant column
			if (showRelevantColumn) {
				allColumns.push(
					columnHelper.accessor("isRelevant", {
						header: "Relevant ?",
						enableSorting: true,
						cell: ({ getValue, row }) => (
							<div className="flex justify-center">
								<button
									className={`px-2 py-1 text-xs rounded transition-opacity ${
										getValue() === false ? "opacity-50" : ""
									}`}
									onClick={() => onToggleRelevant?.(row.original.id)}
								>
									{getValue() === true ? "Yes" : "No"}
								</button>
							</div>
						),
					})
				);
			}

			// Conditionally add Delete column
			if (showDeleteColumn) {
				allColumns.push(
					columnHelper.display({
						id: "delete",
						header: "Delete",
						cell: ({ row }) => (
							<div className="flex justify-center">
								<button
									onClick={() => onDeleteArticle?.(row.original)}
									className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
								>
									Delete
								</button>
							</div>
						),
					})
				);
			}

			// Add remaining common columns (only for review page)
			if (showReviewedColumn || showRelevantColumn) {
				allColumns.push(
					columnHelper.accessor(
						(row) => row.requestQueryString?.toString() ?? "",
						{
							id: "requestQueryString",
							header: "Request Query String",
							enableSorting: true,
							cell: ({ getValue }) => {
								return <div className="text-xs">{getValue()}</div>;
							},
						}
					),
					columnHelper.accessor("nameOfOrg", {
						id: "nameOfOrg",
						header: "Added by:",
						enableSorting: true,
						cell: ({ getValue }) => {
							return <div className="text-xs">{getValue()}</div>;
						},
					}),
					columnHelper.accessor("semanticRatingMax", {
						header: "Nexus Semantic Rating",
						enableSorting: true,
						cell: ({ getValue }) => {
							const value = getValue();
							if (value === "N/A") {
								return <div className="text-center">N/A</div>;
							}
							const normalized = Math.max(0, Math.min(1, Number(value)));
							const green = Math.floor(normalized * 200);
							const color = `rgb(${128 - green / 3}, ${green}, ${128 - green / 3})`;
							const percent = Math.round(normalized * 100);
							return (
								<div className="flex justify-center">
									<span
										className="flex items-center justify-center w-10 h-10 rounded-full text-xs font-semibold"
										style={{ backgroundColor: color }}
									>
										{percent}%
									</span>
								</div>
							);
						},
					}),
					columnHelper.accessor("locationClassifierScore", {
						header: "Nexus Location Rating",
						enableSorting: true,
						cell: ({ getValue }) => {
							const value = getValue();
							if (value === "N/A") {
								return <div className="text-center">N/A</div>;
							}
							const normalized = Math.max(0, Math.min(1, Number(value)));
							const green = Math.floor(normalized * 200);
							const color = `rgb(${128 - green / 3}, ${green}, ${128 - green / 3})`;
							const percent = Math.round(normalized * 100);
							return (
								<div className="flex justify-center">
									<span
										className="flex items-center justify-center w-10 h-10 rounded-full text-xs font-semibold"
										style={{ backgroundColor: color }}
									>
										{percent}%
									</span>
								</div>
							);
						},
					})
				);
			}

			return allColumns;
		},
		[
			onSelectArticle,
			onToggleReviewed,
			onToggleRelevant,
			onDeleteArticle,
			showReviewedColumn,
			showRelevantColumn,
			showDeleteColumn,
		]
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			pagination,
			sorting,
			globalFilter,
			columnVisibility,
		},
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		onGlobalFilterChange: setGlobalFilter,
		onColumnVisibilityChange: setColumnVisibility,
		autoResetPageIndex: false,
	});

	if (loading) {
		return (
			<div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
				<LoadingDots className="py-20" />
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
			{/* Table Controls */}
			<div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200 dark:border-gray-800">
				{/* Show rows */}
				<div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
					<span>Show rows:</span>
					{[5, 10, 20].map((size) => (
						<button
							key={size}
							onClick={() =>
								setPagination((prev) => ({
									...prev,
									pageSize: size,
									pageIndex: 0,
								}))
							}
							className={`px-3 py-1 rounded ${
								pagination.pageSize === size
									? "bg-brand-500 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
							}`}
						>
							{size}
						</button>
					))}
				</div>

				{/* Column Visibility Dropdown */}
				<ColumnVisibilityDropdown table={table} />

				{/* Search */}
				<div className="flex-1 max-w-xs">
					<input
						type="text"
						value={globalFilter ?? ""}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className="w-full h-9 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
						placeholder="Search..."
					/>
				</div>

				{/* Pagination */}
				<div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
					<button
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
						className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						&lt; Prev
					</button>
					<span>
						Page {table.getState().pagination.pageIndex + 1} of{" "}
						{table.getPageCount()}
					</span>
					<button
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
						className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700"
					>
						Next &gt;
					</button>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50 dark:bg-gray-800/50">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										onClick={header.column.getToggleSortingHandler()}
										className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
									>
										<div className="flex items-center gap-1">
											{flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
											{{
												asc: " ▲",
												desc: " ▼",
											}[header.column.getIsSorted() as string] ?? ""}
										</div>
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
						{table.getPaginationRowModel().rows.map((row) => {
							const isSelected = row.original.id === selectedRowId;
							const isApproved = row.original.isApproved;

							// Priority: Approved > Selected > Default
							let rowClasses = "transition-colors";
							if (isApproved) {
								rowClasses += " bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40";
							} else if (isSelected) {
								rowClasses += " bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30";
							} else {
								rowClasses += " hover:bg-gray-50 dark:hover:bg-gray-800/50";
							}

							return (
							<tr
								key={row.id}
								className={rowClasses}
							>
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200"
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default TableReviewArticles;
