/**
 * Plans List Page
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import ComponentCard from '@/components/common/ComponentCard';
import PageMeta from '@/components/common/PageMeta';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import { plansService, Plan } from '@/lib/api/services/plansService';
import { toast } from '@/lib/toast';
import { PencilIcon, TrashBinIcon, PlusIcon } from '@/icons';
import ConfirmDialog from '@/components/ui/confirmDialog/ConfirmDialog';

export default function PlansList() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    planId: number | null;
    planName: string | null;
  }>({
    isOpen: false,
    planId: null,
    planName: null,
  });

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await plansService.getAll({
        page,
        limit: 20,
        q: searchQuery || undefined,
      });
      setPlans(response.results);
      setTotalPages(response.totalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar planos';
      setError(errorMessage);
      toast.error('Erro ao carregar planos', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteDialog({
      isOpen: true,
      planId: id,
      planName: name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.planId) return;

    try {
      await plansService.delete(deleteDialog.planId);
      toast.success('Plano excluído com sucesso!');
      setDeleteDialog({ isOpen: false, planId: null, planName: null });
      fetchPlans();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir plano';
      toast.error('Erro ao excluir plano', errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, planId: null, planName: null });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge color="success" variant="light" size="sm">
        Ativo
      </Badge>
    ) : (
      <Badge color="error" variant="light" size="sm">
        Inativo
      </Badge>
    );
  };

  const calculateTotalPrice = (plan: Plan) => {
    // Use the plan's prices array - prefer default or BRL
    if (!plan.prices || plan.prices.length === 0) {
      return 0;
    }
    
    // Find default price, or BRL, or first price
    const defaultPrice = plan.prices.find((p) => p.isDefault);
    const brlPrice = plan.prices.find((p) => p.currency === 'BRL');
    const price = defaultPrice || brlPrice || plan.prices[0];
    
    return price?.price || 0;
  };

  return (
    <>
      <PageMeta
        title="Planos | Ativiza"
        description="Gerenciamento de planos"
      />
      <div className="space-y-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Planos</h2>
          <Link
            to="/plans/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            <PlusIcon className="size-4" />
            Novo Plano
          </Link>
        </div>

        <ComponentCard title="Planos">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar planos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Nenhum plano encontrado
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Nome
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Descrição
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Features
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Valor Total
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                          {plan.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                          {plan.description || '-'}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                          {plan.features.length} feature{plan.features.length !== 1 ? 's' : ''}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                          {(() => {
                            const total = calculateTotalPrice(plan);
                            return Number.isFinite(total) && total > 0
                              ? `R$ ${total.toFixed(2).replace('.', ',')}`
                              : '-';
                          })()}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm">
                          {getStatusBadge(plan.isActive)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/plans/${plan.id}/edit`}
                              className="p-2 text-gray-600 transition-colors rounded hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                            >
                              <PencilIcon className="size-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(plan.id, plan.name)}
                              className="p-2 text-red-600 transition-colors rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </ComponentCard>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Excluir Plano"
        message="Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita."
        itemName={deleteDialog.planName || undefined}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
}

