import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useCreateSocialSecurity,
  useSocialSecurity,
  useSocialSecurityProjections,
  useUpdateSocialSecurity,
} from '../hooks/useSocialSecurity';
import { useCreateOrUpdateDefaultScenario } from '../hooks/useSavedScenarios';
import type { SocialSecurityCreate } from '../types/social_security';

export function SocialSecurityPage() {
  const { data: socialSecurity, isLoading, error: ssError } = useSocialSecurity();
  const createSS = useCreateSocialSecurity();
  const updateSS = useUpdateSocialSecurity();
  const refreshDefaultScenario = useCreateOrUpdateDefaultScenario();
  const { data: projections, refetch: fetchProjections } = useSocialSecurityProjections();

  const [showProjections, setShowProjections] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SocialSecurityCreate>({
    defaultValues: socialSecurity
      ? {
          birth_date: socialSecurity.birth_date,
          fra_monthly_amount: socialSecurity.fra_monthly_amount,
          spouse_birth_date: socialSecurity.spouse_birth_date ?? '',
          spouse_fra_monthly_amount: socialSecurity.spouse_fra_monthly_amount ?? '',
          spouse_benefit_source: (socialSecurity.spouse_benefit_source ?? 'own') as
            | 'own'
            | 'half_of_partner',
          default_ss_start_age_years: socialSecurity.default_ss_start_age_years ?? null,
          default_ss_start_age_months: socialSecurity.default_ss_start_age_months ?? null,
          default_spouse_ss_start_age_years:
            socialSecurity.default_spouse_ss_start_age_years ?? null,
          default_spouse_ss_start_age_months:
            socialSecurity.default_spouse_ss_start_age_months ?? null,
        }
      : {
          birth_date: '',
          fra_monthly_amount: '4000.00',
          spouse_birth_date: '',
          spouse_fra_monthly_amount: '',
          spouse_benefit_source: 'own' as const,
          default_ss_start_age_years: null,
          default_ss_start_age_months: null,
          default_spouse_ss_start_age_years: null,
          default_spouse_ss_start_age_months: null,
        },
  });

  useEffect(() => {
    if (socialSecurity) {
      reset({
        birth_date: socialSecurity.birth_date,
        fra_monthly_amount: socialSecurity.fra_monthly_amount,
        spouse_birth_date: socialSecurity.spouse_birth_date ?? '',
        spouse_fra_monthly_amount: socialSecurity.spouse_fra_monthly_amount ?? '',
        spouse_benefit_source: (socialSecurity.spouse_benefit_source ?? 'own') as
          | 'own'
          | 'half_of_partner',
        default_ss_start_age_years: socialSecurity.default_ss_start_age_years ?? null,
        default_ss_start_age_months: socialSecurity.default_ss_start_age_months ?? null,
        default_spouse_ss_start_age_years: socialSecurity.default_spouse_ss_start_age_years ?? null,
        default_spouse_ss_start_age_months:
          socialSecurity.default_spouse_ss_start_age_months ?? null,
      });
      // Auto-fetch projections if SS is configured
      fetchProjections();
      setShowProjections(true);
    }
  }, [socialSecurity, reset, fetchProjections]);

  const onSuccess = () => {
    fetchProjections();
    setShowProjections(true);
    refreshDefaultScenario.mutate(undefined, { onError: () => {} });
  };

  const onSubmit = (data: SocialSecurityCreate) => {
    const useOwn = data.spouse_benefit_source === 'own';
    const payload: SocialSecurityCreate = {
      ...data,
      spouse_birth_date: data.spouse_birth_date?.trim() || null,
      spouse_fra_monthly_amount:
        useOwn && data.spouse_fra_monthly_amount?.trim() ? data.spouse_fra_monthly_amount : null,
      spouse_benefit_source: data.spouse_birth_date?.trim()
        ? data.spouse_benefit_source ?? 'own'
        : null,
      default_ss_start_age_years: data.default_ss_start_age_years ?? null,
      default_ss_start_age_months: data.default_ss_start_age_months ?? null,
      default_spouse_ss_start_age_years: data.default_spouse_ss_start_age_years ?? null,
      default_spouse_ss_start_age_months: data.default_spouse_ss_start_age_months ?? null,
    };
    if (socialSecurity) {
      updateSS.mutate(payload, { onSuccess });
    } else {
      createSS.mutate(payload, { onSuccess });
    }
  };

  const watchedFraAmount = watch('fra_monthly_amount');
  const watchedBirthDate = watch('birth_date');

  // Calculate FRA from birth date (for display) - format as "X years Y months"
  const calculateFRADisplay = (birthDate: string): string => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const year = birth.getFullYear();

    // Handle January 1st special case
    let birthYear = year;
    if (birth.getMonth() === 0 && birth.getDate() === 1) {
      birthYear = year - 1;
    }

    if (birthYear <= 1937) return '65 years 0 months';
    if (birthYear === 1938) return '65 years 2 months';
    if (birthYear === 1939) return '65 years 4 months';
    if (birthYear === 1940) return '65 years 6 months';
    if (birthYear === 1941) return '65 years 8 months';
    if (birthYear === 1942) return '65 years 10 months';
    if (birthYear >= 1943 && birthYear <= 1954) return '66 years 0 months';
    if (birthYear === 1955) return '66 years 2 months';
    if (birthYear === 1956) return '66 years 4 months';
    if (birthYear === 1957) return '66 years 6 months';
    if (birthYear === 1958) return '66 years 8 months';
    if (birthYear === 1959) return '66 years 10 months';
    return '67 years 0 months'; // 1960 or later
  };

  const displayedFRA = watchedBirthDate
    ? calculateFRADisplay(watchedBirthDate)
    : socialSecurity?.fra_age
      ? `${parseFloat(socialSecurity.fra_age).toFixed(2)} years`
      : '';

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (ssError) {
    const err = ssError as Error & { response?: { data?: unknown; status?: number } };
    const data = err?.response?.data;
    const detail =
      data != null && typeof data === 'object' && 'detail' in data
        ? (data as { detail?: unknown }).detail
        : undefined;
    const msg =
      typeof detail === 'string'
        ? detail
        : data != null && typeof data === 'object'
          ? JSON.stringify(data)
          : err?.message ?? String(ssError);
    const isTimeout = /timeout|ETIMEDOUT/i.test(msg);
    const isNetwork = /network|failed to fetch|ECONNREFUSED/i.test(msg);
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Social Security Configuration</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
          <p className="font-medium">Unable to load Social Security configuration.</p>
          {isTimeout && (
            <p className="mt-2 text-sm">
              The request timed out. Check that the backend is running (e.g.{' '}
              <code className="bg-red-100 px-1 rounded">docker-compose up backend</code>).
            </p>
          )}
          {isNetwork && (
            <>
              <p className="mt-2 text-sm font-medium">Cannot reach the backend. Try:</p>
              <ol className="mt-2 text-sm list-decimal list-inside space-y-1">
                <li>
                  Start backend:{' '}
                  <code className="bg-red-100 px-1 rounded">docker-compose up -d db backend</code>
                </li>
                <li>
                  Test from terminal:{' '}
                  <code className="bg-red-100 px-1 rounded">
                    curl -s http://localhost:8005/health
                  </code>
                </li>
                <li>
                  In project <code className="bg-red-100 px-1 rounded">.env</code> set{' '}
                  <code className="bg-red-100 px-1 rounded">
                    VITE_API_URL=http://localhost:8005
                  </code>
                  , then restart the frontend.
                </li>
              </ol>
              <p className="mt-2 text-sm">See SETUP_GUIDE.md → “Frontend can’t reach backend”.</p>
            </>
          )}
          {!isTimeout && !isNetwork && (
            <>
              <p className="mt-2 text-sm">
                Server returned 500. From the project root run:{' '}
                <code className="bg-red-100 px-1 rounded block mt-1">
                  ./scripts/run_spouse_ss_migration.sh
                </code>{' '}
                Then restart the backend and reload this page.
              </p>
              <p className="mt-2 text-sm">
                To inspect the DB, open:{' '}
                <a
                  href="/api/v1/social-security/db-check"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  /api/v1/social-security/db-check
                </a>
              </p>
            </>
          )}
          <p className="mt-2 text-sm font-mono break-words">{msg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Social Security Configuration</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {socialSecurity ? 'Update Social Security' : 'Setup Social Security'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              {...register('birth_date', { required: 'Birth date is required' })}
              type="date"
              id="birth_date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.birth_date && (
              <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="fra_age" className="block text-sm font-medium text-gray-700 mb-2">
              Full Retirement Age (FRA)
            </label>
            <input
              type="text"
              id="fra_age"
              value={displayedFRA || 'Calculated from birth date'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Automatically calculated from birth date</p>
          </div>

          <div>
            <label
              htmlFor="fra_monthly_amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Monthly Benefit at FRA
            </label>
            <input
              {...register('fra_monthly_amount', {
                required: 'FRA amount is required',
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: 'Invalid amount format',
                },
              })}
              type="text"
              id="fra_monthly_amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="4000.00"
            />
            {errors.fra_monthly_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.fra_monthly_amount.message}</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spouse (optional)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add spouse date of birth to model dual Social Security. Choose whether the spouse uses
            their own benefit at FRA or ½ of partner&apos;s.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label
                htmlFor="spouse_birth_date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Spouse Date of Birth
              </label>
              <input
                {...register('spouse_birth_date')}
                type="date"
                id="spouse_birth_date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Spouse benefit</label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register('spouse_benefit_source')}
                    value="own"
                    className="text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>Own amount at FRA</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register('spouse_benefit_source')}
                    value="half_of_partner"
                    className="text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>½ of partner&apos;s SS</span>
                </label>
              </div>
            </div>
          </div>
          {watch('spouse_benefit_source') === 'own' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <label
                  htmlFor="spouse_fra_monthly_amount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Spouse Monthly Benefit at FRA
                </label>
                <input
                  {...register('spouse_fra_monthly_amount')}
                  type="text"
                  id="spouse_fra_monthly_amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 2000.00"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Default scenario retirement ages
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            SS start ages used when the Default Scenario is created or refreshed. Leave blank to use
            your FRA.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary (you)</label>
              <div className="flex gap-2">
                <select
                  value={watch('default_ss_start_age_years') ?? ''}
                  onChange={e =>
                    setValue(
                      'default_ss_start_age_years',
                      e.target.value ? parseInt(e.target.value, 10) : null
                    )
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Use my FRA</option>
                  {[62, 63, 64, 65, 66, 67, 68, 69, 70].map(age => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
                <select
                  value={watch('default_ss_start_age_months') ?? ''}
                  onChange={e =>
                    setValue(
                      'default_ss_start_age_months',
                      e.target.value ? parseInt(e.target.value, 10) : null
                    )
                  }
                  className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
                    <option key={m} value={m}>
                      {m} mo
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spouse {socialSecurity?.spouse_birth_date ? '' : '(used when spouse is configured)'}
              </label>
              <div className="flex gap-2">
                <select
                  value={watch('default_spouse_ss_start_age_years') ?? ''}
                  onChange={e =>
                    setValue(
                      'default_spouse_ss_start_age_years',
                      e.target.value ? parseInt(e.target.value, 10) : null
                    )
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Not claiming</option>
                  {[62, 63, 64, 65, 66, 67, 68, 69, 70].map(age => (
                    <option key={age} value={age}>
                      {age}
                    </option>
                  ))}
                </select>
                <select
                  value={watch('default_spouse_ss_start_age_months') ?? ''}
                  onChange={e =>
                    setValue(
                      'default_spouse_ss_start_age_months',
                      e.target.value ? parseInt(e.target.value, 10) : null
                    )
                  }
                  className="w-28 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
                    <option key={m} value={m}>
                      {m} mo
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            {socialSecurity ? 'Update Configuration' : 'Save Configuration'}
          </button>
          {watchedFraAmount && watchedBirthDate && (
            <button
              type="button"
              onClick={() => {
                fetchProjections();
                setShowProjections(true);
              }}
              className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium"
            >
              Calculate Projections
            </button>
          )}
        </div>
      </form>

      {/* Payment Projections: Primary and optional Spouse */}
      {showProjections && projections && projections.primary_projections.length > 0 && (
        <div className="space-y-8">
          <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            <strong>Amounts are in today&apos;s dollars.</strong> Spouse&apos;s benefit (½ of
            primary) is based on your FRA amount in today&apos;s dollars; it is not inflated to the
            year the spouse starts. COLA (cost-of-living adjustment) is applied each year after you
            or your spouse start receiving benefits.
          </p>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Your Social Security (Primary) — by start age
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Age
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Annual
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      vs FRA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projections.primary_projections.map((projection, index) => {
                    const currentFRA = socialSecurity?.fra_age
                      ? parseFloat(socialSecurity.fra_age)
                      : 67.0;
                    const fraYears = Math.floor(currentFRA);
                    const fraMonths = Math.round((currentFRA - fraYears) * 12);
                    const isFra =
                      projection.age_years === fraYears && projection.age_months === fraMonths;
                    return (
                      <tr key={index} className={isFra ? 'bg-blue-50 font-semibold' : ''}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {projection.age_years} years, {projection.age_months} months
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(projection.start_date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(projection.monthly_amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(projection.annual_amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          {projection.reduction_percent ? (
                            <span className="text-red-600">
                              -{parseFloat(projection.reduction_percent).toFixed(1)}%
                            </span>
                          ) : projection.increase_percent ? (
                            <span className="text-green-600">
                              +{parseFloat(projection.increase_percent).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-blue-600 font-semibold">FRA</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {projections.spouse_projections && projections.spouse_projections.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                Spouse&apos;s Social Security — by start age
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Age
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monthly
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Annual
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        vs FRA
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projections.spouse_projections.map((projection, index) => {
                      const spouseFRA = socialSecurity?.spouse_fra_age
                        ? parseFloat(socialSecurity.spouse_fra_age)
                        : 67.0;
                      const fraYears = Math.floor(spouseFRA);
                      const fraMonths = Math.round((spouseFRA - fraYears) * 12);
                      const isFra =
                        projection.age_years === fraYears && projection.age_months === fraMonths;
                      return (
                        <tr key={index} className={isFra ? 'bg-blue-50 font-semibold' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {projection.age_years} years, {projection.age_months} months
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(projection.start_date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(projection.monthly_amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(projection.annual_amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            {projection.reduction_percent ? (
                              <span className="text-red-600">
                                -{parseFloat(projection.reduction_percent).toFixed(1)}%
                              </span>
                            ) : projection.increase_percent ? (
                              <span className="text-green-600">
                                +{parseFloat(projection.increase_percent).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-blue-600 font-semibold">FRA</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
