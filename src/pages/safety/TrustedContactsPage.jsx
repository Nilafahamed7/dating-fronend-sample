import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/common/PageContainer';
import { safetyService } from '../../services/safetyService';
import { ShieldCheckIcon, PlusIcon, TrashIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import AddTrustedContactModal from '../../components/safety/AddTrustedContactModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TrustedContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await safetyService.getTrustedContacts();
      if (response.success) {
        setContacts(response.trustedContacts || []);
      }
    } catch (error) {
      toast.error('Failed to load trusted contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    loadContacts();
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trusted Contacts</h1>
              <p className="text-sm text-gray-500">Manage your emergency contacts</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-5 h-5" />
            Add Contact
          </button>
        </div>

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No trusted contacts</h3>
            <p className="text-sm text-gray-500 mb-4">Add trusted contacts to share your date plans and receive emergency alerts</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-velora-primary text-black rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                      </div>
                      {contact.relation && (
                        <p className="text-xs text-gray-500 mt-1">Relation: {contact.relation}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddTrustedContactModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </PageContainer>
  );
}

