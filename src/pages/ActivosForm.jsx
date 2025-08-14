// src/pages/ActivosForm.jsx
import React, { useEffect, useState } from 'react';
import {
  useForm,
  Controller,
  useFieldArray
} from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import {
  HardDrive,
  Smartphone,
  Monitor,
  Keyboard,
  Usb,
  Wifi,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Save,
  FileText
} from 'lucide-react';
import StepWizard from '../components/StepWizard';
import LocationSelector from '../components/LocationSelector';
import { useNotificationContext } from '../contexts/NotificationContext';
import api from '../services/api';

const categorias = [
  { key: 'Equipos', prefix: 'EQUIPO', icon: HardDrive, color: 'from-blue-500 to-blue-600' },
  { key: 'Móviles', prefix: 'MOV', icon: Smartphone, color: 'from-green-500 to-green-600' },
  { key: 'Monitores', prefix: 'MON', icon: Monitor, color: 'from-purple-500 to-purple-600' },
  { key: 'Periféricos', prefix: 'PER', icon: Keyboard, color: 'from-orange-500 to-orange-600' },
  { key: 'Accesorios', prefix: 'ACC', icon: Usb, color: 'from-red-500 to-red-600' },
  { key: 'Red', prefix: 'RED', icon: Wifi, color: 'from-indigo-500 to-indigo-600' },
];

const marcasEstandar = ['HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Apple', 'Samsung', 'LG', 'Sony', 'Toshiba'];
const rams = [4, 8, 16, 24, 32, 64, 128];
const discosCap = [128, 256, 480, 512, 1024, 2048];

export default function ActivosForm({ edit = false }) {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const { notifyActivoCreated, alertSuccess, alertError } = useNotificationContext();

  // Obtener categoría preseleccionada de URL
  const categoriaPreseleccionada = searchParams.get('categoria') || 'Equipos';

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      categoria: categoriaPreseleccionada,
      codigoAuto: '',
      nombreEquipo: '',
      estado: 'Nuevo',
      ubicacion: '',
      tipoEquipo: '',
      procesador: '',
      sistemaOperativo: '',
      // detalles
      serie: '',
      ram: '',
      marca: '',
      modelo: '',
      discos: [{ tipo: 'SSD', capacidad: '' }],
      pulgadas: '',
      imei: '',
      capacidadMovil: '',
      numeroCelular: '',
      nombre: '',
      cantidad: 1,
      empresa: '',
    },
  });

  const categoria = watch('categoria');
  const nombreEquipo = watch('nombreEquipo');
  const { fields: discos, append, remove } = useFieldArray({
    control,
    name: 'discos',
  });

  // load edit
  useEffect(() => {
    if (edit && codigo) {
      api.get(`/activos/${codigo}`)
        .then(({ data }) => reset(data))
        .catch(console.error);
    }
  }, [edit, codigo, reset]);

  // generar codigo Auto para no-Equipos
  useEffect(() => {
    if (categoria && categoria !== 'Equipos') {
      const pref = categorias.find(c => c.key === categoria)?.prefix || 'GEN';
      setValue('codigoAuto', `${pref}-${nanoid(6).toUpperCase()}`);
    }
  }, [categoria, setValue]);

  // para Equipos, el codigoAuto = nombreEquipo
  useEffect(() => {
    if (categoria === 'Equipos') {
      setValue('codigoAuto', nombreEquipo || '');
    }
  }, [nombreEquipo, categoria, setValue]);

  const onSubmit = async data => {
    if (step < 3) return setStep(s => s + 1);

    // build payload según categoría
    const base = {
      categoria: data.categoria,
      codigo: data.codigoAuto,
      estado: data.estado,
      ubicacion: data.ubicacion.trim(),
      empresa: data.empresa,
    };

    let detalles = {};
    switch (data.categoria) {
      case 'Equipos':
        detalles = {
          nombreEquipo: data.nombreEquipo,
          tipoEquipo: data.tipoEquipo,
          procesador: data.procesador,
          sistemaOperativo: data.sistemaOperativo,
          serie: data.serie,
          ram: data.ram,
          marca: data.marca,
          modelo: data.modelo,
          discosJson: JSON.stringify(data.discos)
        };
        break;
      case 'Monitores':
        detalles = {
          serie: data.serie,
          pulgadas: data.pulgadas,
          marca: data.marca,
          modelo: data.modelo
        };
        break;
      case 'Móviles':
        detalles = {
          modelo: data.modelo,
          marca: data.marca,
          imei: data.imei,
          capacidad: data.capacidadMovil,
          numeroCelular: data.numeroCelular
        };
        break;
      default:
        detalles = { nombre: data.nombre, cantidad: data.cantidad };
    }

    const payload = { ...base, ...detalles };

    // Debug logging para monitores
    if (data.categoria === 'Monitores') {
      console.log('Payload para monitor:', payload);
    }

    try {
      let response;
      if (edit) {
        response = await api.put(`/activos/${codigo}`, payload);
        alertSuccess(`Activo ${data.codigoAuto} actualizado correctamente`);
      } else {
        response = await api.post('/activos', payload);
        notifyActivoCreated(response.data);
        alertSuccess(`Activo ${data.codigoAuto} creado correctamente`);
      }
      navigate('/activos');
    } catch (e) {
      console.error('Error al guardar activo:', e);
      alertError(`Error al ${edit ? 'actualizar' : 'crear'} activo: ${e.message}`);
    }
  };

  // resumen final
  const data = watch();
  const resumen = (() => {
    const out = [
      ['Categoría', data.categoria],
      ['Código', data.codigoAuto],
      ['Estado', data.estado],
      ['Ubicación', data.ubicacion],
      ['Empresa', data.empresa]
    ];
    if (data.categoria === 'Equipos') {
      out.push(['Nombre de equipo', data.nombreEquipo]);
      out.push(['Tipo de equipo', data.tipoEquipo]);
      out.push(['Procesador', data.procesador]);
      if (data.sistemaOperativo) {
        out.push(['Sistema Operativo', data.sistemaOperativo]);
      }
      out.push(['N° Serie', data.serie]);
      out.push(['RAM', `${data.ram} GB`]);
      out.push(['Marca', data.marca]);
      out.push(['Modelo', data.modelo]);
      data.discos.forEach((d, i) => out.push([`Almacenamiento ${i + 1}`, `${d.tipo} ${d.capacidad} GB`]));
    } else if (data.categoria === 'Monitores') {
      out.push(
        ['N° Serie', data.serie],
        ['Pulgadas', `${data.pulgadas}"`],
        ['Marca', data.marca],
        ['Modelo', data.modelo]
      );
    } else if (data.categoria === 'Móviles') {
      out.push(
        ['Modelo', data.modelo],
        ['Marca', data.marca],
        ['IMEI', data.imei],
        ['Capacidad', `${data.capacidadMovil} GB`]
      );
    } else {
      out.push(['Nombre', data.nombre], ['Cantidad', data.cantidad]);
    }
    return out;
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            {edit ? 'Editar Activo' : 'Crear Nuevo Activo'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
            {edit ? 'Modifica la información del activo' : 'Completa la información para registrar un nuevo activo'}
          </p>
          <button
            onClick={() => navigate('/activos')}
            className="inline-flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>

        {/* Main Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <StepWizard current={step} />

          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {step === 1 && (
              <div className="space-y-8">
                {/* Categoría */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <HardDrive className="w-5 h-5 mr-2 text-blue-600" />
                    Selecciona la categoría del activo
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categorias.map(c => (
                      <label key={c.key} className="cursor-pointer group">
                        <input
                          type="radio"
                          {...register('categoria', { required: 'Obligatorio' })}
                          value={c.key}
                          className="sr-only"
                        />
                        <div className={`
                          p-4 text-center border-2 rounded-lg transition-all duration-300 transform group-hover:scale-105
                          ${categoria === c.key
                            ? `border-blue-500 bg-gradient-to-br ${c.color} text-white shadow-lg`
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                          }
                        `}>
                          <c.icon className={`w-6 h-6 mx-auto mb-2 ${categoria === c.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                          <span className="font-medium text-sm">{c.key}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.categoria && (
                    <p className="text-red-500 mt-2 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      {errors.categoria.message}
                    </p>
                  )}
                </div>

                {/* Información básica */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información básica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nombre equipo solo en Equipos */}
                    {categoria === 'Equipos' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre de equipo
                        </label>
                        <input
                          {...register('nombreEquipo', { required: 'Obligatorio' })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Ej: PC-JORGE-001"
                        />
                        {errors.nombreEquipo && (
                          <p className="text-red-500 mt-1 text-sm">{errors.nombreEquipo.message}</p>
                        )}
                      </div>
                    )}

                    {/* Tipo de equipo solo en Equipos */}
                    {categoria === 'Equipos' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de equipo
                        </label>
                        <select
                          {...register('tipoEquipo', { required: 'Obligatorio' })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Selecciona un tipo</option>
                          <option value="Desktop">Desktop</option>
                          <option value="Laptop">Laptop</option>
                          <option value="Servidor">Servidor</option>
                          <option value="Workstation">Workstation</option>
                        </select>
                        {errors.tipoEquipo && (
                          <p className="text-red-500 mt-1 text-sm">{errors.tipoEquipo.message}</p>
                        )}
                      </div>
                    )}

                    {/* Ubicación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ubicación
                      </label>
                      <Controller
                        name="ubicacion"
                        control={control}
                        rules={{ required: 'Obligatorio' }}
                        render={({ field }) => (
                          <LocationSelector
                            value={field.value}
                            onChange={field.onChange}
                            required={true}
                          />
                        )}
                      />
                      {errors.ubicacion && (
                        <p className="text-red-500 mt-1 text-sm">{errors.ubicacion.message}</p>
                      )}
                    </div>

                    {/* Empresa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Empresa
                      </label>
                      <select
                        {...register('empresa', { required: 'Obligatorio' })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Selecciona una empresa</option>
                        <option value="Empresa A">Empresa A</option>
                        <option value="Empresa B">Empresa B</option>
                        <option value="Empresa C">Empresa C</option>
                        <option value="Empresa D">Empresa D</option>
                      </select>
                      {errors.empresa && (
                        <p className="text-red-500 mt-1 text-sm">{errors.empresa.message}</p>
                      )}
                    </div>

                    {/* Código */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Código del activo
                      </label>
                      <input
                        {...register('codigoAuto', {
                          required: 'El código es obligatorio',
                        })}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                      />
                      {errors.codigoAuto && (
                        <p className="text-red-500 mt-1 text-sm">{errors.codigoAuto.message}</p>
                      )}
                    </div>

                    {/* Estado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estado del activo
                      </label>
                      <Controller
                        name="estado"
                        control={control}
                        render={({ field }) => (
                          <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
                            {['Nuevo', 'Usado'].map(v => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => field.onChange(v)}
                                className={`
                                  px-6 py-2 rounded-lg transition-all duration-200 font-medium
                                  ${field.value === v
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
                                  }
                                `}>
                                {v}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Especificaciones técnicas
                </h3>

                {/* Equipos */}
                {categoria === 'Equipos' && (
                  <div className="space-y-8">
                    {/* Marca y Modelo */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Información del fabricante</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marca</label>
                          <select
                            {...register('marca', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Selecciona una marca</option>
                            {marcasEstandar.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          {errors.marca && (
                            <p className="text-red-500 mt-1 text-sm">{errors.marca.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelo</label>
                          <input
                            {...register('modelo', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Ej: ThinkPad X1 Carbon"
                          />
                          {errors.modelo && (
                            <p className="text-red-500 mt-1 text-sm">{errors.modelo.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Procesador y Sistema Operativo */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Procesador y sistema</h4>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Procesador</label>
                          <input
                            {...register('procesador', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Ej: Intel Core i7-12700K"
                          />
                          {errors.procesador && (
                            <p className="text-red-500 mt-1 text-sm">{errors.procesador.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sistema Operativo</label>
                          <input
                            {...register('sistemaOperativo')}
                            placeholder="Ej: Windows 11 Pro, Ubuntu 22.04, macOS Ventura"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Serie y RAM */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Especificaciones técnicas</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">N° Serie</label>
                          <input
                            {...register('serie', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Número de serie del equipo"
                          />
                          {errors.serie && (
                            <p className="text-red-500 mt-1 text-sm">{errors.serie.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">RAM</label>
                          <select
                            {...register('ram', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Selecciona la RAM</option>
                            {rams.map(r => (
                              <option key={r} value={r}>{r} GB</option>
                            ))}
                          </select>
                          {errors.ram && (
                            <p className="text-red-500 mt-1 text-sm">{errors.ram.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Almacenamiento */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-white">Almacenamiento</h4>
                        <button
                          type="button"
                          onClick={() => append({ tipo: 'SSD', capacidad: '' })}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Añadir</span>
                        </button>
                      </div>
                      <div className="space-y-4">
                        {discos.map((d, i) => (
                          <div key={d.id} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <select
                              {...register(`discos.${i}.capacidad`)}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              defaultValue={d.capacidad}
                            >
                              <option value="">Capacidad</option>
                              {discosCap.map(c => (
                                <option key={c} value={c}>{c} GB</option>
                              ))}
                            </select>
                            <select
                              {...register(`discos.${i}.tipo`)}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              defaultValue={d.tipo}
                            >
                              <option value="SSD">SSD</option>
                              <option value="HDD">HDD</option>
                            </select>
                            {discos.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(i)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Monitores */}
                {categoria === 'Monitores' && (
                  <div className="space-y-8">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Información del monitor</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Marca</label>
                          <select
                            {...register('marca', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Selecciona una marca</option>
                            {marcasEstandar.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          {errors.marca && (
                            <p className="text-red-500 mt-1 text-sm">{errors.marca.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelo</label>
                          <input
                            {...register('modelo', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Ej: UltraSharp U2720Q"
                          />
                          {errors.modelo && (
                            <p className="text-red-500 mt-1 text-sm">{errors.modelo.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">N° Serie</label>
                          <input
                            {...register('serie', { required: 'Obligatorio' })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Número de serie del monitor"
                          />
                          {errors.serie && (
                            <p className="text-red-500 mt-1 text-sm">{errors.serie.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pulgadas</label>
                          <input
                            type="number"
                            {...register('pulgadas', { required: 'Obligatorio', min: 1 })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Ej: 27"
                          />
                          {errors.pulgadas && (
                            <p className="text-red-500 mt-1 text-sm">{errors.pulgadas.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Móviles */}
                {categoria === 'Móviles' && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Información del dispositivo móvil</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { name: 'modelo', label: 'Modelo', placeholder: 'Ej: iPhone 14 Pro' },
                        { name: 'marca', label: 'Marca', placeholder: 'Ej: Apple' },
                        { name: 'imei', label: 'IMEI', placeholder: 'Número IMEI del dispositivo' },
                        { name: 'capacidadMovil', label: 'Capacidad (GB)', placeholder: 'Ej: 256' },
                        { name: 'numeroCelular', label: 'Número Celular', placeholder: '+56 9 1234 5678' }
                      ].map(f => (
                        <div key={f.name}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{f.label}</label>
                          <input
                            {...register(f.name, { required: 'Obligatorio' })}
                            placeholder={f.placeholder}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                          {errors[f.name] && (
                            <p className="text-red-500 mt-1 text-sm">{errors[f.name].message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Periféricos, Accesorios, Red */}
                {['Periféricos', 'Accesorios', 'Red'].includes(categoria) && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Información del {categoria.toLowerCase().slice(0, -1)}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                        <input
                          {...register('nombre', { required: 'Obligatorio' })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder={`Nombre del ${categoria.toLowerCase().slice(0, -1)}`}
                        />
                        {errors.nombre && (
                          <p className="text-red-500 mt-1 text-sm">{errors.nombre.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                        <input
                          type="number"
                          {...register('cantidad', { required: 'Obligatorio', min: 1 })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="1"
                        />
                        {errors.cantidad && (
                          <p className="text-red-500 mt-1 text-sm">{errors.cantidad.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paso 3: Resumen */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Resumen del activo
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {resumen.map(([label, val]) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>
                        <span className="text-gray-900 dark:text-white">{val || 'No especificado'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                  ${step < 3
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                {step < 3 ? (
                  <>
                    <span>Siguiente</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Confirmar y guardar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
