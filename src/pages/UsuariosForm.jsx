// src/pages/UsuariosForm.jsx
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import StepWizard from '../components/StepWizard';
import LocationSelector from '../components/LocationSelector';
import { useNotificationContext } from '../contexts/NotificationContext';
import api from '../services/api';

const STEPS = [
  { id: 1, title: 'Información personal' },
  { id: 2, title: 'Detalles' },
  { id: 3, title: 'Revisión y envío' },
];

const DEPARTAMENTOS = [
  'TI',
  'Recursos Humanos',
  'Finanzas',
  'Ventas',
  'Operaciones',
  'Marketing',
];

export default function UsuariosForm({ edit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [usuarios, setUsuarios] = useState([]);
  const { notifyUserCreated, alertSuccess, alertError } = useNotificationContext();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      rut: '',
      departamento: '',
      empresa: '',
      ubicacion: '',
    },
  });

  // si edit, carga los datos
  useEffect(() => {
    if (edit && id) {
      api
        .get(`/usuarios/${id}`)
        .then(({ data }) => {
          // backend devuelve { id, nombre, apellido, rut, email, departamento }
          reset({
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            rut: data.rut,
            departamento: data.departamento,
            empresa: data.empresa || '',
            ubicacion: data.ubicacion || '',
          });
        })
        .catch(console.error);
    }
  }, [edit, id, reset]);

  useEffect(() => {
    // Carga todos los usuarios para validación local
    api.get('/usuarios').then(({ data }) => setUsuarios(data));
  }, []);

  const datos = watch();

  const onSubmit = async (values) => {
    // Avanza pasos
    if (step < 3) {
      return setStep((s) => s + 1);
    }

    // limpia RUT
    const cleanRut = values.rut.replace(/[.-]/g, '').toUpperCase();
    const cleanEmail = values.email.trim().toLowerCase(); // Limpiar y normalizar email

    const payload = {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      email: cleanEmail,
      rut: cleanRut,
      departamento: values.departamento,
      empresa: values.empresa,
      ubicacion: values.ubicacion,
    };

    // Debug logging
    console.log('Payload a enviar:', payload);
    console.log('Email original:', values.email);
    console.log('Email limpio:', cleanEmail);
    console.log('Edit mode:', edit);
    console.log('User ID:', id);

    try {
      let response;
      if (edit) {
        console.log('Enviando PUT a:', `/usuarios/${id}`);
        response = await api.put(`/usuarios/${id}`, payload);
        alertSuccess(`Usuario ${payload.nombre} ${payload.apellido} actualizado correctamente`);
      } else {
        console.log('Enviando POST a:', '/usuarios');
        response = await api.post('/usuarios', payload);
        notifyUserCreated(response.data);
        alertSuccess(`Usuario ${payload.nombre} ${payload.apellido} creado correctamente`);
      }
      navigate('/usuarios');
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      console.error('Error response:', err.response?.data);
      alertError(`Error al ${edit ? 'actualizar' : 'crear'} usuario: ${err.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow">
      <StepWizard current={step} steps={STEPS} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* paso 1 */}
        {step === 1 && (
          <div className="space-y-4">
            {[
              { name: 'nombre', label: 'Nombre' },
              { name: 'apellido', label: 'Apellido' },
              { name: 'email', label: 'Email', type: 'email' },
            ].map(({ name, label, type }) => (
              <div key={name}>
                <label className="block mb-1 font-medium text-gray-900 dark:text-white">{label}</label>
                <input
                  type={type || 'text'}
                  {...register(name, {
                    required: `${label} es obligatorio`,
                    ...(name === 'email' && {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email inválido',
                      },
                    }),
                  })}
                  className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors[name] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[name].message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* paso 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block mb-1 font-medium text-gray-900 dark:text-white">RUT</label>
              <input
                {...register('rut', {
                  required: 'RUT es obligatorio',
                  validate: (v) => {
                    const c = v.replace(/[.-]/g, '');
                    if (!/^[0-9]+[0-9Kk]$/.test(c)) return 'RUT inválido';
                    // Validación de duplicado
                    const existe = usuarios.some(
                      (u) =>
                        u.rut === c &&
                        (!edit || String(u.id) !== String(id))
                    );
                    if (existe) return 'Ya existe un usuario con este RUT';
                    return true;
                  },
                })}
                placeholder="12345678-9"
                className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.rut && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.rut.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-900 dark:text-white">Departamento</label>
              <Controller
                name="departamento"
                control={control}
                rules={{ required: 'Selecciona un departamento' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">-- elige --</option>
                    {DEPARTAMENTOS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.departamento && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.departamento.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Empresa
              </label>
              <Controller
                name="empresa"
                control={control}
                rules={{ required: 'Selecciona una empresa' }}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona una empresa</option>
                    <option value="Empresa A">Empresa A</option>
                    <option value="Empresa B">Empresa B</option>
                    <option value="Empresa C">Empresa C</option>
                    <option value="Empresa D">Empresa D</option>
                  </select>
                )}
              />
              {errors.empresa && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.empresa.message}
                </p>
              )}
            </div>

            <Controller
              name="ubicacion"
              control={control}
              rules={{ required: 'Selecciona una ubicación' }}
              render={({ field }) => (
                <LocationSelector
                  value={field.value}
                  onChange={field.onChange}
                  required={true}
                />
              )}
            />
            {errors.ubicacion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.ubicacion.message}
              </p>
            )}

          </div>
        )}

        {/* paso 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Revisa y confirma</h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Nombre</p>
                <p className="text-gray-700 dark:text-gray-300">{datos.nombre}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Apellido</p>
                <p className="text-gray-700 dark:text-gray-300">{datos.apellido}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email</p>
                <p className="text-gray-700 dark:text-gray-300">{datos.email}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">RUT</p>
                <p className="text-gray-700 dark:text-gray-300">{datos.rut.replace(/[.-]/g, '').toUpperCase()}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium text-gray-900 dark:text-white">Departamento</p>
                <p className="text-gray-700 dark:text-gray-300">{datos.departamento}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium text-gray-900 dark:text-white">Empresa</p>
                <p className="text-gray-700 dark:text-gray-300">{datos.empresa}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium text-gray-900 dark:text-white">Ubicación</p>
                <p className="text-gray-700 dark:text-gray-300">{datos.ubicacion || 'No especificada'}</p>
              </div>
            </div>
          </div>
        )}

        {/* navegación */}
        <div className="flex justify-between">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              Atrás
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {step < 3
              ? 'Siguiente'
              : isSubmitting
                ? 'Guardando…'
                : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
}
