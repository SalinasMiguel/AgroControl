import { Route, Routes } from 'react-router';
import MainLayout from '../layouts/MainLayout';
import DashboardPage from '../pages/DashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import { RequireAuth, RequireSeccion } from '../features/auth/components/RequireAuth';
import CambiarPasswordPage from '../features/auth/pages/CambiarPasswordPage';
import LoginPage from '../features/auth/pages/LoginPage';
import PrediosPage from '../features/predios/pages/PrediosPage';
import ParcelasPage from '../features/parcelas/pages/ParcelasPage';
import CultivosPage from '../features/cultivos/pages/CultivosPage';
import CampanasPage from '../features/campanas/pages/CampanasPage';
import FichaCampanaPage from '../features/campanas/pages/FichaCampanaPage';
import FichaParcelaPage from '../features/parcelas/pages/FichaParcelaPage';
import LaboresPage from '../features/labores/pages/LaboresPage';
import InsumosPage from '../features/insumos/pages/InsumosPage';
import CosechasPage from '../features/cosechas/pages/CosechasPage';
import IncidenciasPage from '../features/incidencias/pages/IncidenciasPage';
import UsuariosPage from '../features/usuarios/pages/UsuariosPage';
import AuditoriaPage from '../features/auditoria/pages/AuditoriaPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="cambiar-password" element={<CambiarPasswordPage />} />
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route element={<RequireSeccion seccion="predios" />}>
            <Route path="predios" element={<PrediosPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="parcelas" />}>
            <Route path="parcelas" element={<ParcelasPage />} />
            <Route path="parcelas/:id" element={<FichaParcelaPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="cultivos" />}>
            <Route path="cultivos" element={<CultivosPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="campanas" />}>
            <Route path="campanas" element={<CampanasPage />} />
            <Route path="campanas/:id" element={<FichaCampanaPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="labores" />}>
            <Route path="labores" element={<LaboresPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="insumos" />}>
            <Route path="insumos" element={<InsumosPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="cosechas" />}>
            <Route path="cosechas" element={<CosechasPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="incidencias" />}>
            <Route path="incidencias" element={<IncidenciasPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="usuarios" />}>
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
          <Route element={<RequireSeccion seccion="auditoria" />}>
            <Route path="auditoria" element={<AuditoriaPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
