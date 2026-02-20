import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import Icon from '../../components/AppIcon';
import ContractForm from './components/ContractForm';
import DocumentManager from './components/DocumentManager';
import AuditInfo from './components/AuditInfo';
import { contractService, documentService } from '../../services/supabaseService';
import { schemaService } from '../../services/supabaseService';
import DynamicFieldRenderer from '../../components/DynamicFieldRenderer';

const EditContract = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractId = location?.state?.contractId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    value: '',
    startDate: '',
    endDate: '',
    length: '',
    status: 'Pending',
    remainingAmount: '',
    providerType: '',
  });
  const [dynamicFields, setDynamicFields] = useState({});

  useEffect(() => {
    if (!contractId) {
      navigate('/contract-dashboard');
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const [contract, docs] = await Promise.all([
          contractService?.getById(contractId),
          documentService?.getByContractId(contractId)
        ]);
        
        if (isMounted) {
          setContractData(contract);
          setDocuments(docs);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [contractId, navigate]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      await contractService?.update(contractId, formData);
      setShowSuccessMessage(true);

      setTimeout(() => {
        navigate('/contract-dashboard');
      }, 2000);
    } catch (err) {
      setError(err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/contract-dashboard');
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setDocuments(updatedDocuments);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const contractData = {
        name: formData?.name,
        client: formData?.client,
        value: parseFloat(formData?.value),
        start_date: formData?.startDate,
        end_date: formData?.endDate,
        length: formData?.length,
        status: formData?.status,
        remaining_amount: parseFloat(formData?.remainingAmount),
        provider_type: formData?.providerType,
      };

      await contractService?.updateContract(contractId, contractData);

      // Save dynamic field values
      if (Object.keys(dynamicFields)?.length > 0) {
        for (const [fieldName, fieldValue] of Object.entries(dynamicFields)) {
          await schemaService?.saveDynamicFieldValue(
            'contracts',
            contractId,
            fieldName,
            fieldValue
          );
        }
      }

      navigate('/contract-dashboard');
    } catch (err) {
      setError(err?.message || 'Failed to update contract');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Icon name="Loader2" size={48} color="var(--color-primary)" className="animate-spin mx-auto mb-4" />
                <p className="text-text-secondary">Loading contract data...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !contractData) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-destructive" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {error ? 'Error Loading Contract' : 'Contract Not Found'}
                </h2>
                <p className="text-text-secondary mb-4">
                  {error || 'The requested contract could not be found.'}
                </p>
                <button
                  onClick={() => navigate('/contract-dashboard')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Breadcrumb />

          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2">
              Edit Contract
            </h1>
            <p className="text-sm md:text-base text-text-secondary">
              Update contract information and manage associated documents
            </p>
          </div>

          {showSuccessMessage && (
            <div className="mb-6 bg-success/10 border border-success rounded-lg p-4 flex items-start space-x-3">
              <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="Check" size={14} color="white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-success">
                  Contract updated successfully!
                </p>
                <p className="text-xs text-success/80 mt-1">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 lg:p-8">
                <div className="mb-6">
                  <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    Contract Information
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Update the contract details below
                  </p>
                </div>
                <ContractForm
                  initialData={contractData}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}
                  formData={formData}
                  setFormData={setFormData}
                />
                <DynamicFieldRenderer
                  entityName="contracts"
                  entityId={contractId}
                  onFieldsChange={setDynamicFields}
                />
              </div>

              <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6 lg:p-8">
                <DocumentManager
                  initialDocuments={documents}
                  onDocumentsChange={handleDocumentsChange}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <AuditInfo
                  lastModified={contractData?.lastModified || contractData?.updatedAt}
                  modifiedBy={contractData?.lastModifiedBy || 'System'}
                />

                <div className="bg-card rounded-lg shadow-elevation-2 p-4 md:p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon name="Info" size={20} color="var(--color-primary)" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-2">
                        Important Notes
                      </h4>
                      <ul className="space-y-2 text-xs md:text-sm text-text-secondary">
                        <li className="flex items-start">
                          <Icon name="Check" size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                          <span>Contract length is automatically calculated from dates</span>
                        </li>
                        <li className="flex items-start">
                          <Icon name="Check" size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                          <span>All changes are tracked for compliance</span>
                        </li>
                        <li className="flex items-start">
                          <Icon name="Check" size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                          <span>Document versions are maintained automatically</span>
                        </li>
                        <li className="flex items-start">
                          <Icon name="Check" size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                          <span>Maximum file size is 10MB per document</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditContract;