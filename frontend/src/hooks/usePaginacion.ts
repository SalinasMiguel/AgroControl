import { useState } from 'react';
import { paginar } from '../shared/utils/paginar';

// Si cambia "clave" (búsqueda o filtros) se vuelve a la página 1.
export function usePaginacion<T>(lista: T[], clave: string, tamanoInicial = 10) {
  const [estado, setEstado] = useState({ page: 1, clave });
  const [pageSize, setPageSize] = useState(tamanoInicial);
  const pagina = paginar(lista, estado.clave === clave ? estado.page : 1, pageSize);
  return {
    pagina,
    props: {
      page: pagina.page,
      totalPages: pagina.totalPages,
      totalItems: pagina.totalItems,
      pageSize,
      pageSizeOptions: [10, 20, 50],
      onPageChange: (page: number) => setEstado({ page, clave }),
      onPageSizeChange: (tamano: number) => {
        setPageSize(tamano);
        setEstado({ page: 1, clave });
      },
    },
  };
}
