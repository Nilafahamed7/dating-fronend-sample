import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import PhotoUpload from '../components/profile/PhotoUpload';
import { MAX_BIO_LENGTH, MARITAL_STATUSES, MAX_LOOKING_FOR_LENGTH, GENDERS } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  PhotoIcon,
  HeartIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function CompleteProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    gender: '',
    bio: '',
    lookingFor: '',
    maritalStatus: '',
    religion: '',
    interests: [],
    location: {
      city: '',
      country: '',
      address: '',
      state: '',
    },
    preferences: {
      ageRange: { min: 18, max: 50 },
      distance: 50,
      gender: 'all',
      goals: [],
    },
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formTouched, setFormTouched] = useState(false);
  const [interests, setInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(true);
  const [religions, setReligions] = useState([]);
  const [loadingReligions, setLoadingReligions] = useState(true);
  const [relationGoals, setRelationGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [availableStates, setAvailableStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    // Load interests, religions, relation goals, and countries
    const loadMasterData = async () => {
      try {
        setLoadingInterests(true);
        setLoadingReligions(true);
        setLoadingGoals(true);
        setLoadingCountries(true);

        const [interestsResponse, religionsResponse, goalsResponse, countriesResponse] = await Promise.all([
          profileService.getInterests().catch(() => ({ interests: [] })),
          profileService.getReligions().catch(() => ({ religions: [] })),
          profileService.getRelationGoals().catch(() => ({ goals: [] })),
          profileService.getCountries().catch(() => ({ success: false, countries: [] })),
        ]);

        const interestsList = interestsResponse?.interests || interestsResponse?.data?.interests || [];
        if (Array.isArray(interestsList) && interestsList.length > 0) {
          const normalizedInterests = interestsList.map(item =>
            typeof item === 'object' ? (item.name || item.title || item) : item
          );
          setInterests(normalizedInterests);
        } else {
          setInterests([]);
        }

        const religionsList = religionsResponse?.religions || religionsResponse?.data?.religions || [];
        if (Array.isArray(religionsList) && religionsList.length > 0) {
          const normalizedReligions = religionsList.map(item =>
            typeof item === 'object' ? (item.name || item.title || item) : item
          );
          setReligions(normalizedReligions);
        } else {
          setReligions([]);
        }

        const goalsList = goalsResponse?.goals || goalsResponse?.data?.goals || [];
        if (Array.isArray(goalsList) && goalsList.length > 0) {
          const normalizedGoals = goalsList.map(item =>
            typeof item === 'object' ? (item.name || item.title || item) : item
          );
          setRelationGoals(normalizedGoals);
        } else {
          setRelationGoals([]);
        }

        if (countriesResponse?.success && Array.isArray(countriesResponse.countries)) {
          setCountries(countriesResponse.countries);
        } else {
          setCountries([]);
        }
      } catch (error) {
        setInterests([]);
        setReligions([]);
        setRelationGoals([]);
        setCountries([]);
      } finally {
        setLoadingInterests(false);
        setLoadingReligions(false);
        setLoadingGoals(false);
        setLoadingCountries(false);
      }
    };
    loadMasterData();
  }, []);

  // Load states when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!formData.location.country) {
        setAvailableStates([]);
        setFormData(prev => ({
          ...prev,
          location: { ...prev.location, state: '' }
        }));
        return;
      }

      if (countries.length === 0) {
        return;
      }

      const selectedCountry = countries.find(c => c.name === formData.location.country);
      if (!selectedCountry) {
        setAvailableStates([]);
        return;
      }

      try {
        setLoadingStates(true);
        const response = await profileService.getStatesByCountry(selectedCountry.code);

        if (response.success && Array.isArray(response.states) && response.states.length > 0) {
          setAvailableStates(response.states);
          if (formData.location.state && !response.states.some(s => s.name === formData.location.state)) {
            setFormData(prev => ({
              ...prev,
              location: { ...prev.location, state: '' }
            }));
          }
        } else {
          setAvailableStates([]);
        }
      } catch (error) {
        setAvailableStates([]);
      } finally {
        setLoadingStates(false);
      }
    };

    loadStates();
  }, [formData.location.country, countries]);

  // Load existing profile data if available
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await profileService.getMyProfile();
        if (response.data) {
          const profileData = response.data.profile || response.data;
          const locationData = profileData?.location || {
            city: '',
            country: '',
            address: '',
            state: '',
          };

          const normalizeValue = (value) => {
            if (!value) return '';
            if (typeof value === 'string') return value;
            if (typeof value === 'object') return value.name || value.title || value || '';
            return String(value);
          };

          const normalizeArray = (arr) => {
            if (!Array.isArray(arr)) return [];
            return arr.map(item => normalizeValue(item));
          };

          const profileInterests = profileData?.interests || [];
          const profileGoals = response.data?.preferences?.goals || profileData?.preferences?.goals || [];
          const userData = response.data?.user || response.data?.userId || user;

          setFormData({
            gender: userData?.gender || profileData?.gender || '',
            bio: profileData?.about || profileData?.bio || '',
            lookingFor: profileData?.lookingFor || '',
            maritalStatus: profileData?.maritalStatus || '',
            religion: normalizeValue(profileData?.religion),
            interests: normalizeArray(profileInterests),
            location: {
              city: locationData.city || '',
              country: locationData.country || '',
              address: locationData.address || '',
              state: locationData.state || '',
              coordinates: locationData.coordinates || undefined,
            },
            preferences: {
              ageRange: response.data?.preferences?.ageRange || { min: 18, max: 50 },
              distance: response.data?.preferences?.distance || 50,
              gender: response.data?.preferences?.gender || 'all',
              goals: normalizeArray(profileGoals),
            },
          });
          setPhotos(profileData?.photos || []);
        }
      } catch (error) {
        }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    if (!formTouched) {
      setFormTouched(true);
    }

    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      const newLocation = { ...formData.location, [locationField]: value };

      if (locationField === 'country') {
        newLocation.state = '';
        setAvailableStates([]);
      }

      setFormData({
        ...formData,
        location: newLocation,
      });

      if (errors[locationField]) {
        setErrors({ ...errors, [locationField]: null });
      }
    } else if (name.startsWith('preferences.')) {
      const prefField = name.split('.')[1];
      if (prefField === 'ageRange.min' || prefField === 'ageRange.max') {
        const rangeField = prefField.split('.')[1];
        let newValue;
        if (value === '' || value === null || value === undefined) {
          newValue = '';
        } else {
          const numValue = parseInt(value, 10);
          if (!isNaN(numValue)) {
            newValue = numValue;
          } else {
            newValue = value;
          }
        }
        setFormData({
          ...formData,
          preferences: {
            ...formData.preferences,
            ageRange: {
              ...formData.preferences.ageRange,
              [rangeField]: newValue,
            },
          },
        });
      } else if (prefField === 'distance') {
        const numValue = parseInt(value, 10);
        const validValue = isNaN(numValue) ? 50 : Math.max(1, Math.min(500, numValue));
        setFormData({
          ...formData,
          preferences: {
            ...formData.preferences,
            distance: validValue,
          },
        });
      } else {
        setFormData({
          ...formData,
          preferences: {
            ...formData.preferences,
            [prefField]: value,
          },
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleInterestToggle = (interest) => {
    if (!formTouched) {
      setFormTouched(true);
    }

    setFormData({
      ...formData,
      interests: formData.interests.includes(interest)
        ? formData.interests.filter((i) => i !== interest)
        : [...formData.interests, interest],
    });
  };

  const handleGoalToggle = (goal) => {
    if (!formTouched) {
      setFormTouched(true);
    }

    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        goals: formData.preferences.goals.includes(goal)
          ? formData.preferences.goals.filter((g) => g !== goal)
          : [...formData.preferences.goals, goal],
      },
    });
  };

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'DatingApp/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch location details');
          }

          const data = await response.json();
          const address = data.address || {};

          const city = address.city || address.town || address.village || address.municipality || '';
          const state = address.state || address.region || address.province || '';
          const country = address.country || '';

          setFormData({
            ...formData,
            location: {
              ...formData.location,
              city: city,
              state: state,
              country: country,
              coordinates: [longitude, latitude],
            },
          });

          setErrors({
            ...errors,
            city: null,
            state: null,
            country: null,
          });

          if (country) {
            const selectedCountry = countries.find(c => c.name === country);
            if (selectedCountry) {
              try {
                const statesResponse = await profileService.getStatesByCountry(selectedCountry.code);
                if (statesResponse.success && Array.isArray(statesResponse.states)) {
                  setAvailableStates(statesResponse.states);
                }
              } catch (error) {
                }
            }
          }

          toast.success('Location detected and filled! Please verify the details.');
        } catch (error) {
          toast.error('Failed to get location details. Please enter manually.');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        toast.error('Failed to get your location. Please enter manually.');
        setGettingLocation(false);
      }
    );
  };

  const handlePhotoUpload = async (file, privacy = 'public', coinCost = 0) => {
    if (!formTouched) {
      setFormTouched(true);
    }

    try {
      setUploading(true);
      const response = await profileService.uploadPhoto(file, privacy, coinCost);
      if (response.success && response.photos) {
        setPhotos(response.photos);
        if (response.photos.length > 0 && errors.photos) {
          setErrors({ ...errors, photos: null });
        }
        toast.dismiss();
        toast.success(response.message || 'Photo uploaded successfully!');
      } else {
        throw new Error(response.message || 'Failed to upload photo');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to upload photo';
      toast.dismiss();
      toast.error(message);
      } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async (photoId) => {
    try {
      await profileService.deletePhoto(photoId);
      setPhotos(photos.filter((p) => p._id !== photoId && p.publicId !== photoId));
      toast.dismiss();
      toast.success('Photo deleted successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to delete photo');
    }
  };

  const handlePhotoPrivacyChange = async (photoId, privacy, coinCost = 0) => {
    try {
      const response = await profileService.updatePhotoPrivacy(photoId, privacy, coinCost);
      if (response.success) {
        setPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            String(photo._id) === String(photoId)
              ? { ...photo, privacy, coinCost: privacy === 'private' ? coinCost : 0 }
              : photo
          )
        );
        toast.dismiss();
        toast.success('Photo privacy updated!');
        return Promise.resolve();
      } else {
        throw new Error(response.message || 'Failed to update photo privacy');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update photo privacy';
      toast.dismiss();
      toast.error(message);
      return Promise.reject(error);
    }
  };

  // Validation - same as ProfileEdit
  const validationErrors = useMemo(() => {
    const newErrors = {};

    // Gender validation
    if (!formData.gender || formData.gender.trim() === '') {
      newErrors.gender = 'Gender is required';
    }

    if (formData.bio !== undefined && formData.bio !== null) {
      if (formData.bio.trim().length === 0) {
        newErrors.bio = 'Bio is required';
      } else if (formData.bio.length < 10) {
        newErrors.bio = 'Bio must be at least 10 characters';
      }
    }

    if (formData.interests !== undefined && formData.interests !== null) {
      if (!formData.interests || formData.interests.length === 0) {
        newErrors.interests = 'Please select at least one interest';
      }
    }

    if (formData.location) {
      const city = formData.location.city;
      const country = formData.location.country;
      const state = formData.location.state;

      if (city !== undefined && city !== null) {
        if (typeof city === 'string' && city.trim().length === 0) {
          newErrors.city = 'City is required';
        } else if (!city) {
          newErrors.city = 'City is required';
        }
      }
      if (country !== undefined && country !== null) {
        if (typeof country === 'string' && country.trim().length === 0) {
          newErrors.country = 'Country is required';
        } else if (!country) {
          newErrors.country = 'Country is required';
        }
      }
      if (state !== undefined && state !== null) {
        if (typeof state === 'string' && state.trim().length === 0) {
          newErrors.state = 'State is required';
        } else if (!state) {
          newErrors.state = 'State is required';
        }
      }
    }

    if (!formData.preferences.ageRange) {
      newErrors.ageRange = 'Age range is required';
    } else {
      const minAge = Number(formData.preferences.ageRange.min);
      const maxAge = Number(formData.preferences.ageRange.max);

      if (formData.preferences.ageRange.min !== '' && formData.preferences.ageRange.min !== null && formData.preferences.ageRange.min !== undefined) {
        if (!isNaN(minAge)) {
          if (minAge < 18) {
            newErrors.ageMin = 'Minimum age must be at least 18';
          } else if (minAge > 100) {
            newErrors.ageMin = 'Minimum age must be at most 100';
          }
        }
      }

      if (formData.preferences.ageRange.max !== '' && formData.preferences.ageRange.max !== null && formData.preferences.ageRange.max !== undefined) {
        if (!isNaN(maxAge)) {
          if (maxAge > 100) {
            newErrors.ageMax = 'Maximum age must be at most 100';
          } else if (maxAge < 18) {
            newErrors.ageMax = 'Maximum age must be at least 18';
          }
        }
      }

      if (
        !isNaN(minAge) &&
        !isNaN(maxAge) &&
        formData.preferences.ageRange.min !== '' &&
        formData.preferences.ageRange.max !== '' &&
        minAge >= maxAge
      ) {
        newErrors.ageRange = 'Minimum age must be less than maximum age';
      }
    }

    if (!formData.preferences.distance || formData.preferences.distance < 1) {
      newErrors.distance = 'Distance is required (minimum 1 km)';
    }

    if (!formData.preferences.gender || formData.preferences.gender === '') {
      newErrors.gender = 'Gender preference is required';
    }

    if (photos.length === 0) {
      newErrors.photos = 'Please upload at least one photo';
    }

    return newErrors;
  }, [formData, photos]);

  useEffect(() => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      Object.keys(validationErrors).forEach((key) => {
        if (validationErrors[key]) {
          newErrors[key] = validationErrors[key];
        } else if (key !== 'ageMin' && key !== 'ageMax' && key !== 'ageRange') {
          delete newErrors[key];
        }
      });

      if (validationErrors.ageMin) {
        newErrors.ageMin = validationErrors.ageMin;
      }
      if (validationErrors.ageMax) {
        newErrors.ageMax = validationErrors.ageMax;
      }
      if (validationErrors.ageRange) {
        newErrors.ageRange = validationErrors.ageRange;
      }

      return newErrors;
    });
  }, [validationErrors]);

  const validateForm = () => {
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (uploading) {
      toast.error('Please wait for photo upload to complete');
      return;
    }

    setFormTouched(true);

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        gender: formData.gender, // Update user gender
        about: formData.bio,
        lookingFor: formData.lookingFor,
        maritalStatus: formData.maritalStatus,
        religion: formData.religion,
        interests: formData.interests,
        location: formData.location,
        profileCompleted: true, // Mark as completed after successful save
      };

      const response = await profileService.updateProfile(updateData);

      if (formData.preferences) {
        try {
          const minAge = parseInt(formData.preferences.ageRange?.min, 10) || 18;
          const maxAge = parseInt(formData.preferences.ageRange?.max, 10) || 50;

          if (minAge < 18 || minAge > 100 || maxAge < 18 || maxAge > 100 || minAge >= maxAge) {
            throw new Error('Invalid age range. Minimum must be 18-100, maximum must be 18-100, and minimum must be less than maximum.');
          }

          const preferencesData = {
            ageRange: [minAge, maxAge],
            distance: parseInt(formData.preferences.distance, 10) || 50,
            goals: formData.preferences.goals && formData.preferences.goals.length > 0 ? formData.preferences.goals : undefined,
          };

          if (preferencesData.ageRange || preferencesData.distance !== undefined || preferencesData.goals) {
            await profileService.updatePreferences(preferencesData);
          }
        } catch (prefError) {
          const errorMessage = prefError.response?.data?.message || prefError.message || 'Failed to update preferences';
          toast.error(errorMessage);
        }
      }

      // Fetch the complete updated profile to update AuthContext
      try {
        const fullProfileResponse = await profileService.getMyProfile();
        if (fullProfileResponse.data) {
          // Update AuthContext with complete profile data including interests and gender
          const userData = fullProfileResponse.data.user || fullProfileResponse.data.userId || fullProfileResponse.data;
          const updatedUserData = {
            ...user,
            ...fullProfileResponse.data,
            gender: userData?.gender || formData.gender || user?.gender, // Ensure gender is included
            interests: fullProfileResponse.data.profile?.interests || fullProfileResponse.data.user?.interests || formData.interests,
            profile: {
              ...fullProfileResponse.data.profile,
              interests: fullProfileResponse.data.profile?.interests || formData.interests,
            },
            preferences: fullProfileResponse.data.preferences,
            profileCompleted: true, // Ensure profileCompleted is set
          };
          updateUser(updatedUserData);
          localStorage.setItem('user', JSON.stringify(updatedUserData));
        }
      } catch (profileError) {
        if (response.data) {
          const updatedUser = {
            ...user,
            ...response.data,
            gender: formData.gender || user?.gender, // Ensure gender is included
            interests: formData.interests,
            profileCompleted: true,
          };
          updateUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          // If no response data, at least update gender and mark as completed
          const updatedUser = {
            ...user,
            gender: formData.gender || user?.gender, // Ensure gender is included
            profileCompleted: true,
          };
          updateUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }

      // Remove the justSignedUp flag since profile is now completed
      localStorage.removeItem('justSignedUp');

      toast.dismiss();
      toast.success('Profile completed successfully!');

      // Redirect to home after successful save
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to complete profile';
      toast.dismiss();
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-velora-primary to-purple-500 bg-clip-text text-transparent mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-black flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-xl">
                    <PhotoIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  Photos ({photos.length}/6) <span className="text-red-500">*</span>
                </h3>
                {photos.length < 6 && (
                  <span className="text-sm text-gray-500 bg-yellow-50 px-3 py-1 rounded-full">Add up to 6 photos</span>
                )}
              </div>
              <PhotoUpload
                photos={photos}
                onUpload={handlePhotoUpload}
                onDelete={handlePhotoDelete}
                onPrivacyChange={handlePhotoPrivacyChange}
              />
              {errors.photos && (
                <p className="mt-2 text-sm text-red-500">{errors.photos}</p>
              )}
              {uploading && (
                <div className="mt-4 flex items-center gap-2 text-yellow-600">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              )}
            </motion.div>

            {/* Bio Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <label htmlFor="bio" className="block text-lg font-bold text-black mb-3 flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <UserIcon className="w-5 h-5 text-yellow-600" />
                </div>
                About Me <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.bio) {
                    setErrors({ ...errors, bio: null });
                  }
                }}
                maxLength={MAX_BIO_LENGTH}
                rows={6}
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition-all ${
                  errors.bio
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:ring-yellow-500 focus:border-yellow-400'
                }`}
                placeholder="Tell people about yourself, your interests, what you're looking for..."
              />
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-xs text-gray-500">
                    {formData.bio.length}/{MAX_BIO_LENGTH} characters
                  </p>
                  {errors.bio && (
                    <p className="text-sm text-red-500 mt-1">{errors.bio}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Looking For Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <label htmlFor="lookingFor" className="block text-lg font-bold text-black mb-3 flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <HeartIcon className="w-5 h-5 text-yellow-600" />
                </div>
                What I'm Looking For
              </label>
              <textarea
                id="lookingFor"
                name="lookingFor"
                value={formData.lookingFor}
                onChange={handleChange}
                maxLength={MAX_LOOKING_FOR_LENGTH}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 resize-none transition-all"
                placeholder="Describe what you're looking for in a partner or relationship..."
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.lookingFor.length}/{MAX_LOOKING_FOR_LENGTH} characters
              </p>
            </motion.div>

            {/* Gender Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <label htmlFor="gender" className="block text-lg font-bold text-black mb-3 flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <UserIcon className="w-5 h-5 text-yellow-600" />
                </div>
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.gender) {
                    setErrors({ ...errors, gender: null });
                  }
                }}
                required
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                  errors.gender
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-200 focus:ring-yellow-500 focus:border-yellow-400'
                }`}
              >
                <option value="">Select your gender</option>
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </motion.div>

            {/* Marital Status Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <label htmlFor="maritalStatus" className="block text-lg font-bold text-black mb-3 flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <UserIcon className="w-5 h-5 text-yellow-600" />
                </div>
                Marital Status
              </label>
              <select
                id="maritalStatus"
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition-all"
              >
                <option value="">Select marital status</option>
                {MARITAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Religion Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <label htmlFor="religion" className="block text-lg font-bold text-black mb-3 flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <UserIcon className="w-5 h-5 text-yellow-600" />
                </div>
                Religion
              </label>
              {loadingReligions ? (
                <div className="flex items-center justify-center py-4">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                  <span className="ml-2 text-gray-600 text-sm">Loading religions...</span>
                </div>
              ) : (
                <select
                  id="religion"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 transition-all"
                >
                  <option value="">Select religion</option>
                  {religions.map((religion) => (
                    <option key={religion} value={religion}>
                      {religion}
                    </option>
                  ))}
                </select>
              )}
            </motion.div>

            {/* Interests Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <label className="block text-lg font-bold text-black mb-4 flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <HeartIcon className="w-5 h-5 text-yellow-600" />
                </div>
                Interests ({formData.interests.length}) <span className="text-red-500">*</span>
              </label>
              {loadingInterests ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                  <span className="ml-2 text-gray-600">Loading interests...</span>
                </div>
              ) : interests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No interests available. Please contact admin to add interests.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {interests.map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <motion.button
                        key={interest}
                        type="button"
                        onClick={() => {
                          handleInterestToggle(interest);
                          if (errors.interests) {
                            setErrors({ ...errors, interests: null });
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-yellow-500 text-black shadow-md hover:bg-yellow-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 hover:border-yellow-300 border border-transparent'
                        }`}
                      >
                        {interest}
                        {isSelected && (
                          <CheckCircleIcon className="w-4 h-4 inline-block ml-2" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
              {errors.interests && (
                <p className="mt-2 text-sm text-red-500">{errors.interests}</p>
              )}
            </motion.div>

            {/* Location Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <label className="block text-lg font-bold text-black flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-xl">
                    <MapPinIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  Location <span className="text-red-500">*</span>
                </label>
                <motion.button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {gettingLocation ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Getting Location...</span>
                    </>
                  ) : (
                    <>
                      <MapPinIcon className="w-4 h-4" />
                      <span>Use Current Location</span>
                    </>
                  )}
                </motion.button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="location.city"
                    value={formData.location.city || ''}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.city) {
                        setErrors({ ...errors, city: null });
                      }
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.city
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:ring-yellow-500 focus:border-yellow-400'
                    }`}
                    placeholder="Enter your city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  {loadingCountries ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                      <span className="text-sm text-gray-600">Loading countries...</span>
                    </div>
                  ) : (
                    <select
                      id="country"
                      name="location.country"
                      value={formData.location.country || ''}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.country) {
                          setErrors({ ...errors, country: null });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                        errors.country
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-yellow-500 focus:border-yellow-400'
                      }`}
                    >
                      <option value="">Select your country</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  {loadingStates ? (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                      <span className="text-sm text-gray-600">Loading states...</span>
                    </div>
                  ) : !formData.location.country ? (
                    <select
                      id="state"
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                    >
                      <option value="">Please select a country first</option>
                    </select>
                  ) : (
                    <select
                      id="state"
                      name="location.state"
                      value={formData.location.state || ''}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.state) {
                          setErrors({ ...errors, state: null });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                        errors.state
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-yellow-500 focus:border-yellow-400'
                      }`}
                    >
                      <option value="">Select your state</option>
                      {availableStates.map((state) => (
                        <option key={state.code} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                  )}
                  {formData.location.country && availableStates.length === 0 && !loadingStates && (
                    <p className="mt-1 text-xs text-gray-500">No states available for this country. Please enter manually.</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address (Optional)
                  </label>
                  <input
                    id="address"
                    name="location.address"
                    value={formData.location.address || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400"
                    placeholder="Enter your address"
                  />
                </div>
              </div>
            </motion.div>

            {/* Preferences Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-yellow-50 via-yellow-50/50 to-white rounded-2xl shadow-lg p-6 border-2 border-yellow-200"
            >
              <label className="block text-lg font-bold text-black mb-4">Search Preferences</label>
              <div className="space-y-4">
                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Age Range: {formData.preferences.ageRange.min} - {formData.preferences.ageRange.max} years <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Minimum Age <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name="preferences.ageRange.min"
                        value={formData.preferences.ageRange.min}
                        onChange={(e) => {
                          handleChange(e);
                          const numValue = parseInt(e.target.value, 10);
                          if (!isNaN(numValue) && numValue >= 18 && numValue <= 100) {
                            setErrors((prevErrors) => {
                              const newErrors = { ...prevErrors };
                              delete newErrors.ageMin;
                              delete newErrors.ageRange;
                              return newErrors;
                            });
                          }
                        }}
                        min="18"
                        max="100"
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                          errors.ageMin || errors.ageRange
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-yellow-500 focus:border-yellow-400'
                        }`}
                      />
                      {errors.ageMin && (
                        <p className="mt-1 text-xs text-red-500">{errors.ageMin}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Maximum Age <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name="preferences.ageRange.max"
                        value={formData.preferences.ageRange.max}
                        onChange={(e) => {
                          handleChange(e);
                          const numValue = parseInt(e.target.value, 10);
                          if (!isNaN(numValue) && numValue >= 18 && numValue <= 100) {
                            setErrors((prevErrors) => {
                              const newErrors = { ...prevErrors };
                              delete newErrors.ageMax;
                              delete newErrors.ageRange;
                              return newErrors;
                            });
                          }
                        }}
                        min="18"
                        max="100"
                        className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                          errors.ageMax || errors.ageRange
                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:ring-yellow-500 focus:border-yellow-400'
                        }`}
                      />
                      {errors.ageMax && (
                        <p className="mt-1 text-xs text-red-500">{errors.ageMax}</p>
                      )}
                    </div>
                  </div>
                  {errors.ageRange && (
                    <p className="mt-2 text-sm text-red-500">{errors.ageRange}</p>
                  )}
                </div>

                {/* Distance */}
                <div>
                  <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Distance: {formData.preferences.distance} km <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="range"
                    id="distance"
                    name="preferences.distance"
                    value={formData.preferences.distance}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.distance) {
                        setErrors({ ...errors, distance: null });
                      }
                    }}
                    min="1"
                    max="500"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 km</span>
                    <span>500 km</span>
                  </div>
                  {errors.distance && (
                    <p className="mt-1 text-sm text-red-500">{errors.distance}</p>
                  )}
                </div>

                {/* Gender Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Looking For <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['all', 'male', 'female', 'other'].map((gender) => (
                      <motion.button
                        key={gender}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            preferences: { ...formData.preferences, gender }
                          });
                          if (errors.gender) {
                            setErrors({ ...errors, gender: null });
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          formData.preferences.gender === gender
                            ? 'bg-yellow-500 text-black shadow-md hover:bg-yellow-600'
                            : 'bg-white text-gray-700 hover:bg-yellow-50 border-2 border-gray-200 hover:border-yellow-300'
                        }`}
                      >
                        {gender === 'all' ? 'Everyone' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="mt-2 text-sm text-red-500">{errors.gender}</p>
                  )}
                </div>

                {/* Relationship Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Relationship Goals
                  </label>
                  {loadingGoals ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                      <span className="ml-2 text-gray-600">Loading goals...</span>
                    </div>
                  ) : relationGoals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No relationship goals available. Please contact admin to add goals.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {relationGoals.map((goal) => {
                        const isSelected = formData.preferences.goals.includes(goal);
                        return (
                          <motion.button
                            key={goal}
                            type="button"
                            onClick={() => handleGoalToggle(goal)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-yellow-500 text-black shadow-md hover:bg-yellow-600'
                                : 'bg-white text-gray-700 hover:bg-yellow-50 border-2 border-gray-200 hover:border-yellow-300'
                            }`}
                          >
                            {goal} {isSelected && <CheckCircleIcon className="w-4 h-4 inline-block ml-2" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                  {formData.preferences.goals.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Selected: {formData.preferences.goals.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="sticky bottom-4 z-10"
            >
              <motion.button
                type="submit"
                disabled={loading || Object.keys(validationErrors).length > 0}
                whileHover={Object.keys(validationErrors).length === 0 && !loading ? { scale: 1.02, y: -2 } : {}}
                whileTap={Object.keys(validationErrors).length === 0 && !loading ? { scale: 0.98 } : {}}
                className={`w-full px-8 py-4 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black font-bold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all ${
                  loading || Object.keys(validationErrors).length > 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-2xl hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-600'
                }`}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Completing Profile...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-6 h-6" />
                    <span>Complete Profile</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
