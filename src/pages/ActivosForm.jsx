// src/pages/ActivosForm.jsx
import React, { useEffect, useState } from 'react';
import {
  useForm,
  Controller,
  useFieldArray
} from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { HardDrive, Smartphone, Monitor, Keyboard, Usb, Wifi } from 'lucide-react';
import StepWizard from '../components/StepWizard';
import LocationSelector from '../components/LocationSelector';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../services/api';

const categorias = [
  { key: 'Equipos', prefix: 'EQUIPO', icon: HardDrive },
  { key: 'Móviles', prefix: 'MOV', icon: Smartphone },
  { key: 'Monitores', prefix: 'MON', icon: Monitor },
  { key: 'Periféricos', prefix: 'PER', icon: Keyboard },
  { key: 'Accesorios', prefix: 'ACC', icon: Usb },
  { key: 'Red', prefix: 'RED', icon: Wifi },
];

const marcasEstandar = ['HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Apple',];
const rams = [4, 8, 16, 24, 32, 64, 128];
const discosCap = [128, 256, 480, 512, 1024, 2048];

export default function ActivosForm({ edit = false }) {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const { notifyActivoCreated, notifySuccess, notifyError } = useNotifications();
  // const [activos, setActivos] = useState([]); // Removed unused variables

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
        notifySuccess(`Activo ${data.codigoAuto} actualizado correctamente`);
      } else {
        response = await api.post('/activos', payload);
        notifyActivoCreated(response.data);
        notifySuccess(`Activo ${data.codigoAuto} creado correctamente`);
      }
      navigate('/activos');
    } catch (e) {
      console.error('Error al guardar activo:', e);
      notifyError(`Error al ${edit ? 'actualizar' : 'crear'} activo: ${e.message}`);
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
    <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow">
      <StepWizard current={step} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {step === 1 && (
          <>
            {/* categoría */}
            <div>
              <p className="font-medium mb-2 text-gray-900 dark:text-white">Categoría</p>
              <div className="grid grid-cols-3 gap-4">
                {categorias.map(c => (
                  <label key={c.key} className="cursor-pointer">
                    <input
                      type="radio"
                      {...register('categoria', { required: 'Obligatorio' })}
                      value={c.key}
                      className="sr-only"
                    />
                    <div className={`p-4 text-center border rounded-lg transition flex flex-col items-center space-y-2
                      ${categoria === c.key ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'}`}>
                      <c.icon className="w-6 h-6" />
                      <span className="text-gray-900 dark:text-white">{c.key}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.categoria && <p className="text-red-500">{errors.categoria.message}</p>}
            </div>

            {/* nombre equipo solo en Equipos */}
            {categoria === 'Equipos' && (
              <div>
                <label className="block mb-1 text-gray-900 dark:text-white">Nombre de equipo</label>
                <input
                  {...register('nombreEquipo', { required: 'Obligatorio' })}
                  className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.nombreEquipo && <p className="text-red-500">{errors.nombreEquipo.message}</p>}
              </div>
            )}

            {/* tipo de equipo solo en Equipos */}
            {categoria === 'Equipos' && (
              <div>
                <label className="block mb-1 text-gray-900 dark:text-white">Tipo de equipo</label>
                <select
                  {...register('tipoEquipo', { required: 'Obligatorio' })}
                  className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">-- elige --</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Servidor">Servidor</option>
                  <option value="Workstation">Workstation</option>
                </select>
                {errors.tipoEquipo && <p className="text-red-500">{errors.tipoEquipo.message}</p>}
              </div>
            )}

            {/* ubicación para todos */}
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
            {errors.ubicacion && <p className="text-red-500">{errors.ubicacion.message}</p>}

            {/* empresa para todos */}
            <div>
              <label className="block mb-1 text-gray-900 dark:text-white">Empresa</label>
              <select
                {...register('empresa', { required: 'Obligatorio' })}
                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">-- Selecciona una empresa --</option>
                <option value="Bunzl">Bunzl</option>
                <option value="Vicsa">Vicsa</option>
                <option value="Tecnoboga">Tecnoboga</option>
                <option value="B2B">B2B</option>
              </select>
              {errors.empresa && <p className="text-red-500">{errors.empresa.message}</p>}
            </div>

            {/* código */}
            <div>
              <label className="block mb-1 text-gray-900 dark:text-white">Código</label>
              <input
                {...register('codigoAuto', {
                  required: 'El código es obligatorio',
                })}
                readOnly
                className="w-full bg-gray-100 dark:bg-gray-600 border px-3 py-2 rounded text-gray-900 dark:text-white"
              />
              {errors.codigoAuto && (
                <p className="text-red-500">{errors.codigoAuto.message}</p>
              )}
            </div>

            {/* estado */}
            <div>
              <p className="mb-1 font-medium text-gray-900 dark:text-white">Estado</p>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <div className="inline-flex rounded-xl bg-gray-200 dark:bg-gray-700 p-1">
                    {['Nuevo', 'Usado'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => field.onChange(v)}
                        className={`px-4 py-2 rounded-lg transition
                          ${field.value === v ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Equipos */}
            {categoria === 'Equipos' && (
              <div className="space-y-6">
                {/* marca/modelo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">Marca</label>
                    <select
                      {...register('marca', { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">--</option>
                      {marcasEstandar.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">Modelo</label>
                    <input
                      {...register('modelo', { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                {/* procesador */}
                <div>
                  <label className="block mb-1 text-gray-900 dark:text-white">Procesador</label>
                  <input
                    {...register('procesador', { required: 'Obligatorio' })}
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {errors.procesador && <p className="text-red-500">{errors.procesador.message}</p>}
                </div>
                {/* sistema operativo */}
                <div>
                  <label className="block mb-1 text-gray-900 dark:text-white">Sistema Operativo</label>
                  <input
                    {...register('sistemaOperativo')}
                    placeholder="Ej: Windows 11 Pro, Ubuntu 22.04, macOS Ventura"
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {/* serie & ram */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">N° Serie</label>
                    <input
                      {...register('serie', { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">RAM</label>
                    <select
                      {...register('ram', { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">--</option>
                      {rams.map(r => (
                        <option key={r} value={r}>{r} GB</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* almacenamiento */}
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 dark:text-white">Almacenamiento</p>
                  {discos.map((d, i) => (
                    <div key={d.id} className="grid grid-cols-3 gap-4 items-end">

                      <select
                        {...register(`discos.${i}.capacidad`)}
                        className="border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        defaultValue={d.capacidad}
                      >
                        <option value="">--</option>
                        {discosCap.map(c => (
                          <option key={c} value={c}>{c} GB</option>
                        ))}
                      </select>
                      <select
                        {...register(`discos.${i}.tipo`)}
                        className="border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        defaultValue={d.tipo}
                      >
                        <option value="SSD">SSD</option>
                        <option value="HDD">HDD</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => remove(i)}
                        className="text-red-500 hover:underline"
                      >Eliminar</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => append({ tipo: 'SSD', capacidad: '' })}
                    className="mt-2 text-blue-600 hover:underline"
                  >+ Añadir almacenamiento</button>
                </div>
              </div>
            )}

            {/* Monitores */}
            {categoria === 'Monitores' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">Marca</label>
                    <select
                      {...register('marca', { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">--</option>
                      {marcasEstandar.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">Modelo</label>
                    <input
                      {...register('modelo', { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">N° Serie</label>
                    <input
                      {...register('serie', { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-900 dark:text-white">Pulgadas</label>
                    <input
                      type="number"
                      {...register('pulgadas', { required: 'Obligatorio', min: 1 })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Móviles */}
            {categoria === 'Móviles' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'modelo', label: 'Modelo' },
                  { name: 'marca', label: 'Marca' },
                  { name: 'imei', label: 'IMEI' },
                  { name: 'capacidadMovil', label: 'Capacidad (GB)' },
                  { name: 'numeroCelular', label: 'Número Celular' }
                ].map(f => (
                  <div key={f.name}>
                    <label className="block mb-1 text-gray-900 dark:text-white">{f.label}</label>
                    <input
                      {...register(f.name, { required: 'Obligatorio' })}
                      className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Periféricos, Accesorios, Red */}
            {['Periféricos', 'Accesorios', 'Red'].includes(categoria) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-gray-900 dark:text-white">Nombre</label>
                  <input
                    {...register('nombre', { required: 'Obligatorio' })}
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-900 dark:text-white">Cantidad</label>
                  <input
                    type="number"
                    {...register('cantidad', { required: 'Obligatorio', min: 1 })}
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Paso 3: Resumen */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen del activo</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-900 dark:text-white">
              {resumen.map(([label, val]) => (
                <li key={label}>
                  <span className="font-medium">{label}:</span> {val}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >Atrás</button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {step < 3 ? 'Siguiente' : isSubmitting ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
}
