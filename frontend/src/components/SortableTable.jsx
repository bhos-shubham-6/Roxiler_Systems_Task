export default function SortableTable({ columns, data, sortBy, sortOrder, onSort, rowKey = 'id' }) {
  const handleSort = (field) => {
    if (!field) return;
    if (sortBy === field) {
      onSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(field, 'asc');
    }
  };

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={sortBy === col.sortField ? 'sorted' : ''}
                onClick={() => col.sortField && handleSort(col.sortField)}
              >
                {col.label}
                {col.sortField && (
                  <span className="sort-icon">
                    {sortBy === col.sortField ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-state">
                No records found
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row[rowKey]}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
