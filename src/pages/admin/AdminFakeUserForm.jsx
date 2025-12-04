import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ArrowLeftIcon,
    PhotoIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService } from '../../services/adminService';

export default function AdminFakeUserForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEdit);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Only for create
        phone: '',
        gender: 'female',
        dob: '',
        bio: '',
        location: '', // String input for simplicity, or structured
        interests: '', // Comma separated

        // Extended Profile Fields
        lookingFor: '',
        maritalStatus: 'Single',
        religion: '',

        // Preferences
        prefAgeMin: 18,
        prefAgeMax: 50,
        prefDistance: 100,
        prefGender: 'all',

        isActive: true,
        isPremium: false,
        notes: '',
    });

    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    const [gallery, setGallery] = useState([]); // Array of Files
    const [galleryPreviews, setGalleryPreviews] = useState([]); // Array of strings (urls)

    const [existingPhotos, setExistingPhotos] = useState([]); // For edit mode
    const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);

    useEffect(() => {
        if (isEdit) {
            loadUser();
        }
    }, [id]);

    const loadUser = async () => {
        try {
            const response = await adminService.getFakeUser(id);
            const user = response.user;
            const profile = user.profile || {};
            const preferences = user.preferences || {};

            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                gender: user.gender || 'female',
                dob: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                bio: user.bio || '',
                location: profile.location?.formattedAddress || user.location?.address || '',
                interests: (user.interests || []).join(', '),

                lookingFor: profile.lookingFor || '',
                maritalStatus: profile.maritalStatus || 'Single',
                religion: profile.religion || '',

                prefAgeMin: preferences.ageRange?.min || 18,
                prefAgeMax: preferences.ageRange?.max || 50,
                prefDistance: preferences.distance || 100,
                prefGender: preferences.gender || 'all',

                isActive: user.isActive,
                isPremium: user.isPremium,
                notes: user.fakeMetadata?.notes || '',
            });

            // Handle photos
            if (user.photos && user.photos.length > 0) {
                const primary = user.photos.find(p => p.isPrimary) || user.photos[0];
                setAvatarPreview(primary.url);

                // Rest are gallery
                const others = user.photos.filter(p => p._id !== primary._id);
                setExistingPhotos(others);
            }

            setInitialLoading(false);
        } catch (error) {
            toast.error('Failed to load user details');
            navigate('/admin/fake-users');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setGallery(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setGalleryPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeGalleryImage = (index) => {
        setGallery(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingPhoto = (photoId) => {
        setExistingPhotos(prev => prev.filter(p => p._id !== photoId));
        setDeletedPhotoIds(prev => [...prev, photoId]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();

            // Append basic fields
            Object.keys(formData).forEach(key => {
                if (key === 'interests') {
                    // Convert comma separated string to array
                    const interestsArray = formData[key].split(',').map(i => i.trim()).filter(i => i);
                    data.append(key, JSON.stringify(interestsArray));
                } else if (key === 'location') {
                    // Simple string for now, backend handles it
                    data.append(key, formData[key]);
                } else {
                    data.append(key, formData[key]);
                }
            });

            // Append files
            if (avatar) {
                data.append('avatar', avatar);
            }

            gallery.forEach(file => {
                data.append('gallery', file);
            });

            if (isEdit && deletedPhotoIds.length > 0) {
                data.append('deletedPhotoIds', JSON.stringify(deletedPhotoIds));
            }

            if (isEdit) {
                await adminService.updateFakeUser(id, data);
                toast.success('Fake user updated successfully');
            } else {
                await adminService.createFakeUser(data);
                toast.success('Fake user created successfully');
            }

            navigate('/admin/fake-users');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save fake user');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <AdminLayout title={isEdit ? 'Edit Fake User' : 'Create Fake User'} selectedNavKey="fakeUsers">
                <div className="flex justify-center py-20">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title={isEdit ? 'Edit Fake User' : 'Create Fake User'}
            subtitle="Management"
            selectedNavKey="fakeUsers"
            headerActions={
                <button
                    onClick={() => navigate('/admin/fake-users')}
                    className="px-4 py-2 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back
                </button>
            }
        >
            <section className="p-4 lg:p-8 xl:p-10 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>

                            {!isEdit && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Leave empty for default"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                <input
                                    type="date"
                                    name="dob"
                                    required
                                    value={formData.dob}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About</label>
                            <textarea
                                name="bio"
                                rows="4"
                                value={formData.bio}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location (City, Country)</label>
                            <input
                                type="text"
                                name="location"
                                placeholder="e.g. New York, USA"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interests (Comma separated)</label>
                            <input
                                type="text"
                                name="interests"
                                placeholder="Travel, Music, Food"
                                value={formData.interests}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                            />
                        </div>
                    </div>

                    {/* Extended Profile Info */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Extended Profile Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                                <select
                                    name="maritalStatus"
                                    value={formData.maritalStatus}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                >
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Separated">Separated</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                                <input
                                    type="text"
                                    name="religion"
                                    value={formData.religion}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Looking For</label>
                                <input
                                    type="text"
                                    name="lookingFor"
                                    placeholder="e.g. Serious Relationship, Friendship"
                                    value={formData.lookingFor}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Match Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range (Min - Max)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        name="prefAgeMin"
                                        min="18"
                                        max="100"
                                        value={formData.prefAgeMin}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input
                                        type="number"
                                        name="prefAgeMax"
                                        min="18"
                                        max="100"
                                        value={formData.prefAgeMax}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Distance (km)</label>
                                <input
                                    type="number"
                                    name="prefDistance"
                                    min="1"
                                    value={formData.prefDistance}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Gender</label>
                                <select
                                    name="prefGender"
                                    value={formData.prefGender}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                >
                                    <option value="all">Everyone</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Photos Card */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Photos</h3>

                        {/* Avatar */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (Public)</label>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-velora-primary/10 file:text-velora-primary hover:file:bg-velora-primary/20"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Recommended: Square JPG/PNG, max 5MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Gallery */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Private Gallery</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                {/* Existing Photos */}
                                {existingPhotos.map((photo) => (
                                    <div key={photo._id} className="relative aspect-square rounded-xl overflow-hidden group">
                                        <img src={photo.url} alt="Gallery" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingPhoto(photo._id)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs p-1 text-center">
                                            Existing
                                        </div>
                                    </div>
                                ))}

                                {/* New Previews */}
                                {galleryPreviews.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeGalleryImage(index)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-0 inset-x-0 bg-green-500/80 text-white text-xs p-1 text-center">
                                            New
                                        </div>
                                    </div>
                                ))}

                                {/* Upload Button */}
                                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-velora-primary hover:bg-velora-primary/5 transition">
                                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-2">Add Photos</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleGalleryChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Settings Card */}
                    <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900">Account Settings</h3>

                        <div className="flex flex-col gap-4">
                            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-velora-primary rounded focus:ring-velora-primary"
                                />
                                <div>
                                    <span className="font-medium text-gray-900">Active Account</span>
                                    <p className="text-xs text-gray-500">User will be visible in suggestions</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    name="isPremium"
                                    checked={formData.isPremium}
                                    onChange={handleInputChange}
                                    className="w-5 h-5 text-velora-primary rounded focus:ring-velora-primary"
                                />
                                <div>
                                    <span className="font-medium text-gray-900">Premium Status</span>
                                    <p className="text-xs text-gray-500">User appears as a premium member</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Internal)</label>
                            <textarea
                                name="notes"
                                rows="3"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-velora-primary/60"
                                placeholder="Internal notes about this fake user..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/fake-users')}
                            className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 rounded-2xl bg-velora-primary text-white font-semibold hover:bg-velora-primary/90 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <LoadingSpinner size="sm" color="white" />}
                            {isEdit ? 'Update Fake User' : 'Create Fake User'}
                        </button>
                    </div>
                </form>
            </section>
        </AdminLayout>
    );
}
