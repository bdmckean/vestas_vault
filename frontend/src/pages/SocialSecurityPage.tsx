import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useCreateSocialSecurity,
  useSocialSecurity,
  useSocialSecurityProjections,
  useUpdateSocialSecurity,
} from '../hooks/useSocialSecurity';
import type { SocialSecurityCreate } from '../types/social_security';

export function SocialSecurityPage() {
  const { data: socialSecurity, isLoading } = useSocialSecurity();
  const createSS = useCreateSocialSecurity();
  const updateSS = useUpdateSocialSecurity();
  const { data: projections, refetch: fetchProjections } = useSocialSecurityProjections();

  const [showProjections, setShowProjections] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SocialSecurityCreate>({
    defaultValues: socialSecurity
      ? {
          birth_date: socialSecurity.birth_date,
          fra_monthly_amount: socialSecurity.fra_monthly_amount,
        }
      : {
          birth_date: '',
          fra_monthly_amount: '4000.00',
        },
  });

  useEffect(() => {
    if (socialSecurity) {
      reset({
        birth_date: socialSecurity.birth_date,
        fra_monthly_amount: socialSecurity.fra_monthly_amount,
      });
      // Auto-fetch projections if SS is configured
      fetchProjections();
      setShowProjections(true);
    }
  }, [socialSecurity, reset, fetchProjections]);

  const onSubmit = (data: SocialSecurityCreate) => {
    if (socialSecurity) {
      updateSS.mutate(data, {
        onSuccess: () => {
          fetchProjections();
          setShowProjections(true);
        },
      });
    } else {
      createSS.mutate(data, {
        onSuccess: () => {
          fetchProjections();
          setShowProjections(true);
        },
      });
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
  
  const displayedFRA = watchedBirthDate ? calculateFRADisplay(watchedBirthDate) : (socialSecurity?.fra_age ? `${parseFloat(socialSecurity.fra_age).toFixed(2)} years` : '');

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
            <label htmlFor="fra_monthly_amount" className="block text-sm font-medium text-gray-700 mb-2">
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

      {/* Payment Projections Table */}
      {showProjections && projections && projections.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Social Security Payment Projections (Age 62-70)
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
                    Monthly Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Annual Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    vs FRA
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projections.map((projection, index) => {
                  // Check if this is FRA - use stored FRA from backend
                  const currentFRA = socialSecurity?.fra_age ? parseFloat(socialSecurity.fra_age) : 67.0;
                  const fraYears = Math.floor(currentFRA);
                  const fraMonths = Math.round((currentFRA - fraYears) * 12);
                  const isFra = projection.age_years === fraYears && projection.age_months === fraMonths;
                  
                  return (
                    <tr
                      key={index}
                      className={isFra ? 'bg-blue-50 font-semibold' : ''}
                    >
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
  );
}
