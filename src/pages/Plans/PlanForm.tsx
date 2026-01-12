/**
 * Plan Form (Create/Edit)
 */

import { useEffect, useState, useMemo } from 'react';
import {
  useForm,
  FormProvider,
  useFieldArray,
  Controller,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, useParams } from 'react-router';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import PageMeta from '@/components/common/PageMeta';
import FormInput from '@/components/form/input/FormInput';
import { plansService } from '@/lib/api/services/plansService';
import { featuresService, Feature } from '@/lib/api/services/featuresService';
import { modulesService, Module } from '@/lib/api/services/modulesService';
import {
  createPlanSchema,
  updatePlanSchema,
  CreatePlanFormData,
  UpdatePlanFormData,
  PlanFeatureConfigFormData,
  PlanFeaturePriceFormData,
} from '@/lib/validations/plans.schema';
import { toast } from '@/lib/toast';
import FormSkeleton from '@/components/ui/skeleton/FormSkeleton';
import Checkbox from '@/components/form/input/Checkbox';
import Autocomplete from '@/components/form/input/Autocomplete';
import MoneyInput from '@/components/form/input/MoneyInput';
import { TrashBinIcon, CheckCircleIcon, PlusIcon } from '@/icons';
import { RESET_PERIODS, CURRENCIES, BILLING_PERIODS } from '@/config/constants';

interface GroupedFeatures {
  module: Module | null;
  features: Feature[];
}

export default function PlanForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  const methods = useForm<CreatePlanFormData | UpdatePlanFormData>({
    // @ts-expect-error - Yup schema type compatibility issue with RHF
    resolver: yupResolver(isEdit ? updatePlanSchema : createPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      billingPeriod: 'MONTHLY',
      isActive: true,
      isPublic: true,
      sortOrder: 0,
      features: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'features',
  });

  // Group features by module
  const groupedFeatures = useMemo<GroupedFeatures[]>(() => {
    const groups: Map<number | 'none', GroupedFeatures> = new Map();

    availableFeatures.forEach((feature) => {
      const moduleId = feature.moduleId || 'none';
      if (!groups.has(moduleId)) {
        const module = feature.moduleId
          ? availableModules.find((m) => m.id === feature.moduleId) || null
          : null;
        groups.set(moduleId, { module, features: [] });
      }
      groups.get(moduleId)!.features.push(feature);
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (!a.module && !b.module) return 0;
      if (!a.module) return 1;
      if (!b.module) return -1;
      return a.module!.name.localeCompare(b.module!.name);
    });
  }, [availableFeatures, availableModules]);

  // Fetch modules and features
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuresResponse, modulesResponse] = await Promise.all([
          featuresService.getAll({ limit: 1000 }),
          modulesService.getAll({ limit: 1000 }),
        ]);
        setAvailableFeatures(
          featuresResponse.results.filter((feature: Feature) => feature.isActive)
        );
        setAvailableModules(
          modulesResponse.results.filter((module: Module) => module.isActive)
        );
      } catch {
        toast.error(
          'Erro ao carregar dados',
          'Não foi possível carregar features e módulos'
        );
      }
    };
    fetchData();
  }, []);

  // Fetch plan data if editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchPlan = async () => {
        setIsFetching(true);
        try {
          const plan = await plansService.getById(Number(id));
          methods.reset({
            name: plan.name,
            description: plan.description || '',
            billingPeriod: plan.billingPeriod,
            isActive: plan.isActive,
            isPublic: plan.isPublic,
            sortOrder: plan.sortOrder || 0,
            maxOperations: plan.maxOperations,
            maxClients: plan.maxClients,
            maxUsers: plan.maxUsers,
            maxStorage: plan.maxStorage,
            features: plan.features.map((f) => ({
              featureId: f.featureId,
              isEnabled: f.isEnabled,
              operationLimit: f.operationLimit,
              resetPeriod: f.resetPeriod,
              prices: f.prices || [],
            })),
          } as UpdatePlanFormData);
          setIsActive(plan.isActive);
          setIsPublic(plan.isPublic);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Erro ao carregar plano';
          toast.error('Erro ao carregar plano', errorMessage);
        } finally {
          setIsFetching(false);
        }
      };
      fetchPlan();
    }
  }, [id, isEdit, methods]);

  const onSubmit = async (data: unknown) => {
    setIsLoading(true);
    try {
      const submitData = data as CreatePlanFormData | UpdatePlanFormData;
      if (isEdit && id) {
        await plansService.update(Number(id), submitData as UpdatePlanFormData);
        toast.success('Plano atualizado com sucesso!');
      } else {
        await plansService.create(submitData as CreatePlanFormData);
        toast.success('Plano criado com sucesso!');
      }
      navigate('/plans');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao salvar plano';
      toast.error('Erro ao salvar plano', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAllFromModule = (moduleFeatures: Feature[]) => {
    const allSelected = moduleFeatures.every((feature) => {
      return fields.some(
        (_, idx) => methods.watch(`features.${idx}.featureId`) === feature.id
      );
    });

    moduleFeatures.forEach((feature) => {
      const existingIndex = fields.findIndex(
        (_, idx) => methods.watch(`features.${idx}.featureId`) === feature.id
      );

      if (allSelected) {
        // Remove all features from this module
        if (existingIndex !== -1) {
          remove(existingIndex);
        }
      } else {
        // Add all features from this module
        if (existingIndex === -1) {
          append({
            featureId: feature.id,
            isEnabled: true,
            operationLimit: null,
            resetPeriod: 'LIFETIME',
            prices: [
              {
                currency: 'BRL',
                price: 0,
                isDefault: true,
              },
            ],
          } as PlanFeatureConfigFormData);
        }
      }
    });
  };

  const handleToggleFeature = (featureId: number) => {
    const existingIndex = fields.findIndex(
      (_, idx) => methods.watch(`features.${idx}.featureId`) === featureId
    );

      if (existingIndex === -1) {
        // Add feature with default price
        append({
          featureId,
          isEnabled: true,
          operationLimit: null,
          resetPeriod: 'LIFETIME',
          prices: [
            {
              currency: 'BRL',
              price: 0,
              isDefault: true,
            },
          ],
        } as PlanFeatureConfigFormData);
      } else {
        // Remove feature
        remove(existingIndex);
      }
  };


  const getTotalPrice = (currency: string = 'BRL') => {
    const features = methods.watch('features') || [];
    const total = features
      .filter((feature) => feature.isEnabled)
      .reduce((sum, feature) => {
        const price = feature.prices?.find((p) => p.currency === currency);
        const priceValue = typeof price?.price === 'number' ? price.price : 0;
        return sum + priceValue;
      }, 0);
    return Number.isFinite(total) ? total : 0;
  };

  return (
    <>
      <PageMeta
        title={isEdit ? 'Editar Plano | Ativiza' : 'Novo Plano | Ativiza'}
        description={isEdit ? 'Editar plano' : 'Criar novo plano'}
      />
      <PageBreadcrumb pageTitle={isEdit ? 'Editar Plano' : 'Novo Plano'} />
      <div className='space-y-6'>
        <ComponentCard title={isEdit ? 'Editar Plano' : 'Novo Plano'}>
          {isFetching ? (
            <FormSkeleton />
          ) : (
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                    <FormInput
                      name='name'
                      label='Nome'
                      type='text'
                      placeholder='Nome do plano'
                      required
                      disabled={isLoading}
                    />
                    <FormInput
                      name='description'
                      label='Descrição'
                      type='text'
                      placeholder='Descrição do plano'
                      disabled={isLoading}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                    <div>
                      <label className='block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                        Período de Cobrança
                      </label>
                      <Autocomplete
                        options={BILLING_PERIODS}
                        placeholder='Selecione o período...'
                        disabled={isLoading}
                        allowCustom={false}
                        value={methods.watch('billingPeriod') || 'MONTHLY'}
                        onChange={(value) =>
                          methods.setValue(
                            'billingPeriod',
                            value as 'MONTHLY' | 'YEARLY'
                          )
                        }
                      />
                    </div>
                    <FormInput
                      name='sortOrder'
                      label='Ordem de Exibição'
                      type='number'
                      placeholder='0'
                      disabled={isLoading}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                    <FormInput
                      name='maxOperations'
                      label='Limite de Operações'
                      type='number'
                      placeholder='Ilimitado'
                      disabled={isLoading}
                    />
                    <FormInput
                      name='maxClients'
                      label='Limite de Clientes'
                      type='number'
                      placeholder='Ilimitado'
                      disabled={isLoading}
                    />
                    <FormInput
                      name='maxUsers'
                      label='Limite de Usuários'
                      type='number'
                      placeholder='Ilimitado'
                      disabled={isLoading}
                    />
                    <FormInput
                      name='maxStorage'
                      label='Limite de Armazenamento (MB)'
                      type='number'
                      placeholder='Ilimitado'
                      disabled={isLoading}
                    />
                  </div>

                  <div className='flex items-center gap-6'>
                    <div className='flex items-center gap-3'>
                      <Checkbox
                        checked={isActive}
                        onChange={(checked) => {
                          setIsActive(checked);
                          methods.setValue('isActive', checked);
                        }}
                      />
                      <span className='block font-normal text-gray-700 text-theme-sm dark:text-gray-400'>
                        Plano ativo
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Checkbox
                        checked={isPublic}
                        onChange={(checked) => {
                          setIsPublic(checked);
                          methods.setValue('isPublic', checked);
                        }}
                      />
                      <span className='block font-normal text-gray-700 text-theme-sm dark:text-gray-400'>
                        Plano público
                      </span>
                    </div>
                  </div>

                  <div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
                    <div className='mb-6'>
                      <h3 className='text-lg font-semibold text-gray-800 dark:text-white/90 mb-4'>
                        Funcionalidades do Plano
                      </h3>

                      {/* Grouped Features by Module */}
                      <div className='space-y-4'>
                        {groupedFeatures.map((group) => (
                          <div
                            key={group.module?.id || 'no-module'}
                            className='border border-gray-200 rounded-lg dark:border-gray-700 p-4'
                          >
                            <div className='flex items-center justify-between mb-3'>
                              <h4 className='font-medium text-gray-800 dark:text-white/90'>
                                {group.module?.name || 'Sem Módulo'}
                              </h4>
                              <button
                                type='button'
                                onClick={() =>
                                  handleToggleAllFromModule(group.features)
                                }
                                disabled={isLoading}
                                className='text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium'
                              >
                                {group.features.every((feature) =>
                                  fields.some(
                                    (_, idx) =>
                                      methods.watch(
                                        `features.${idx}.featureId`
                                      ) === feature.id
                                  )
                                )
                                  ? 'Desmarcar Todas'
                                  : 'Selecionar Todas'}
                              </button>
                            </div>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2'>
                              {group.features.map((feature) => {
                                const isSelected = fields.some(
                                  (_, idx) =>
                                    methods.watch(`features.${idx}.featureId`) ===
                                    feature.id
                                );
                                return (
                                  <button
                                    key={feature.id}
                                    type='button'
                                    onClick={() =>
                                      handleToggleFeature(feature.id)
                                    }
                                    disabled={isLoading}
                                    className={`relative text-left px-3 py-2 text-sm rounded border transition-all ${
                                      isSelected
                                        ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400'
                                        : 'bg-white border-gray-300 hover:border-brand-500 hover:bg-brand-50 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-brand-500'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className='absolute top-1 right-1'>
                                        <CheckCircleIcon className='size-5 text-green-600 dark:text-green-400' />
                                      </div>
                                    )}
                                    <div className='font-medium pr-6'>
                                      {feature.name}
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      {feature.key}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Configured Features */}
                    {fields.length === 0 ? (
                      <div className='p-4 text-sm text-center text-gray-500 bg-gray-50 rounded-lg dark:bg-gray-800 dark:text-gray-400'>
                        Nenhuma funcionalidade adicionada. Selecione funcionalidades acima para
                        configurá-las.
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        <h4 className='font-medium text-gray-800 dark:text-white/90'>
                          Funcionalidades Configuradas
                        </h4>
                        {fields.map((field, index) => {
                          const feature = availableFeatures.find(
                            (f) =>
                              f.id === methods.watch(`features.${index}.featureId`)
                          );
                          const isEnabled = Boolean(methods.watch(
                            `features.${index}.isEnabled`
                          ));
                          const operationLimit = methods.watch(
                            `features.${index}.operationLimit`
                          );
                          const prices = methods.watch(
                            `features.${index}.prices`
                          ) as PlanFeaturePriceFormData[] | undefined;

                          return (
                            <div
                              key={field.id}
                              className='p-4 border border-gray-200 rounded-lg dark:border-gray-700 space-y-4'
                            >
                              <div className='flex items-center justify-between'>
                                <div>
                                  <h5 className='font-medium text-gray-800 dark:text-white/90'>
                                    {feature?.name || 'Funcionalidade não encontrada'}
                                  </h5>
                                  <p className='text-xs text-gray-500'>
                                    {feature?.key}
                                  </p>
                                </div>
                                <button
                                  type='button'
                                  onClick={() => remove(index)}
                                  disabled={isLoading}
                                  className='p-2 text-red-600 transition-colors rounded hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50'
                                >
                                  <TrashBinIcon className='size-5' />
                                </button>
                              </div>

                              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                                <div className='flex items-center gap-3'>
                                  <Checkbox
                                    checked={isEnabled}
                                    onChange={(checked) =>
                                      methods.setValue(
                                        `features.${index}.isEnabled`,
                                        checked
                                      )
                                    }
                                  />
                                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                                    Habilitada
                                  </span>
                                </div>

                                <div>
                                  <label className='block mb-2 text-xs font-medium text-gray-700 dark:text-gray-300'>
                                    Limite de Operações
                                  </label>
                                  <div className='flex items-center gap-2'>
                                    <FormInput
                                      name={`features.${index}.operationLimit`}
                                      type='number'
                                      placeholder='Ilimitado'
                                      disabled={isLoading || operationLimit === null}
                                    />
                                    <Checkbox
                                      checked={operationLimit === null}
                                      onChange={(checked) =>
                                        methods.setValue(
                                          `features.${index}.operationLimit`,
                                          checked ? null : 0
                                        )
                                      }
                                    />
                                    <span className='text-xs text-gray-500 whitespace-nowrap'>
                                      Ilimitado
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <label className='block mb-2 text-xs font-medium text-gray-700 dark:text-gray-300'>
                                    Período de Reset
                                  </label>
                                  <Autocomplete
                                    options={RESET_PERIODS}
                                    placeholder='Período...'
                                    disabled={isLoading}
                                    allowCustom={false}
                                    value={
                                      methods.watch(
                                        `features.${index}.resetPeriod`
                                      ) || 'LIFETIME'
                                    }
                                    onChange={(value) =>
                                      methods.setValue(
                                        `features.${index}.resetPeriod`,
                                        value as 'MONTHLY' | 'YEARLY' | 'LIFETIME'
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              {/* Prices Section */}
                              <div className='border-t border-gray-200 dark:border-gray-700 pt-4 mt-4'>
                                <div className='flex items-center justify-between mb-4'>
                                  <div>
                                    <label className='text-sm font-semibold text-gray-800 dark:text-white/90'>
                                      Preços
                                    </label>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                                      Configure os preços desta funcionalidade em diferentes moedas
                                    </p>
                                  </div>
                                  <button
                                    type='button'
                                    onClick={() => {
                                      const currentPrices =
                                        methods.getValues(
                                          `features.${index}.prices`
                                        ) || [];
                                      // Check which currencies are already added
                                      const existingCurrencies = currentPrices.map(
                                        (p) => p.currency
                                      );
                                      const nextCurrency =
                                        CURRENCIES.find(
                                          (c) => !existingCurrencies.includes(c.value)
                                        )?.value || 'BRL';

                                      methods.setValue(
                                        `features.${index}.prices`,
                                        [
                                          ...currentPrices,
                                          {
                                            currency: nextCurrency,
                                            price: 0,
                                            isDefault:
                                              currentPrices.length === 0,
                                          },
                                        ]
                                      );
                                    }}
                                    disabled={
                                      isLoading ||
                                      (prices?.length || 0) >= 4
                                    }
                                    className='inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 rounded hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                  >
                                    <PlusIcon className='size-3' />
                                    Adicionar Moeda
                                  </button>
                                </div>

                                {prices && prices.length > 0 ? (
                                  <div className='space-y-2'>
                                    {prices.map((price, priceIndex) => {
                                      const currencyInfo = CURRENCIES.find(
                                        (c) => c.value === price.currency
                                      );
                                      const currencySymbol =
                                        currencyInfo?.symbol || 'R$';

                                      return (
                                        <div
                                          key={priceIndex}
                                          className='grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr_auto_auto] items-end'
                                        >
                                          <Autocomplete
                                            options={CURRENCIES.map((c) => ({
                                              value: c.value,
                                              label: c.label,
                                            }))}
                                            placeholder='Moeda'
                                            disabled={isLoading}
                                            allowCustom={false}
                                            value={price.currency || ''}
                                            onChange={(value) => {
                                              const currentPrices =
                                                methods.getValues(
                                                  `features.${index}.prices`
                                                ) || [];
                                              currentPrices[priceIndex].currency =
                                                value;
                                              methods.setValue(
                                                `features.${index}.prices`,
                                                currentPrices
                                              );
                                            }}
                                          />
                                        <Controller
                                          name={`features.${index}.prices.${priceIndex}.price`}
                                          control={methods.control}
                                          render={({
                                            field: priceField,
                                            fieldState,
                                          }) => (
                                            <div>
                                              <MoneyInput
                                                value={priceField.value}
                                                onChange={(value) =>
                                                  priceField.onChange(value)
                                                }
                                                onBlur={priceField.onBlur}
                                                placeholder='0,00'
                                                disabled={isLoading}
                                                prefix={`${currencySymbol} `}
                                                decimalSeparator=','
                                                thousandSeparator='.'
                                                decimalScale={2}
                                                fixedDecimalScale
                                              />
                                              {fieldState.error && (
                                                <p className='mt-1 text-xs text-red-600 dark:text-red-400'>
                                                  {fieldState.error.message}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        />
                                        <div className='flex items-center gap-2'>
                                          <Checkbox
                                            checked={Boolean(price.isDefault)}
                                            onChange={(checked) => {
                                              const currentPrices =
                                                methods.getValues(
                                                  `features.${index}.prices`
                                                ) || [];
                                              // Unset other defaults for same currency
                                              currentPrices.forEach((p, idx) => {
                                                if (
                                                  p.currency === price.currency
                                                ) {
                                                  p.isDefault = idx === priceIndex && checked;
                                                }
                                              });
                                              methods.setValue(
                                                `features.${index}.prices`,
                                                currentPrices
                                              );
                                            }}
                                          />
                                          <span className='text-xs text-gray-500'>
                                            Padrão
                                          </span>
                                        </div>
                                        <button
                                          type='button'
                                          onClick={() => {
                                            const currentPrices =
                                              methods.getValues(
                                                `features.${index}.prices`
                                              ) || [];
                                            currentPrices.splice(priceIndex, 1);
                                            methods.setValue(
                                              `features.${index}.prices`,
                                              currentPrices
                                            );
                                          }}
                                          disabled={isLoading}
                                          className='p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded'
                                        >
                                          <TrashBinIcon className='size-4' />
                                        </button>
                                      </div>
                                    );
                                  })}
                                  </div>
                                ) : (
                                  <div className='p-4 text-center border border-dashed border-gray-300 rounded-lg dark:border-gray-700'>
                                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-2'>
                                      Nenhum preço configurado
                                    </p>
                                    <button
                                      type='button'
                                      onClick={() => {
                                        methods.setValue(
                                          `features.${index}.prices`,
                                          [
                                            {
                                              currency: 'BRL',
                                              price: 0,
                                              isDefault: true,
                                            },
                                          ]
                                        );
                                      }}
                                      disabled={isLoading}
                                      className='text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium'
                                    >
                                      Adicionar primeiro preço
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Total Prices Summary */}
                        <div className='p-4 bg-gray-50 rounded-lg dark:bg-gray-800 space-y-2'>
                          {CURRENCIES.map((currency) => {
                            const total = getTotalPrice(currency.value);
                            if (total === 0 || !Number.isFinite(total)) return null;
                            return (
                              <div
                                key={currency.value}
                                className='flex items-center justify-between'
                              >
                                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                  Total ({currency.label}):
                                </span>
                                <span className='text-lg font-bold text-gray-900 dark:text-white'>
                                  {currency.symbol}{' '}
                                  {Number(total).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                    <button
                      type='submit'
                      disabled={isLoading}
                      className='px-6 py-2 text-sm font-medium text-white transition-colors bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isLoading ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type='button'
                      onClick={() => navigate('/plans')}
                      className='px-6 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            </FormProvider>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
