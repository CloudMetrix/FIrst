import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Breadcrumb from '../../components/ui/Breadcrumb';
import ContractInfoSection from './components/ContractInfoSection';
import DocumentSection from './components/DocumentSection';
import ActionButtons from './components/ActionButtons';

const ContractDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const contractId = location?.state?.contractId;

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  const mockContracts = [
    {
      id: 1,
      name: "Cloud Infrastructure Services Agreement",
      vendor: "TechCloud Solutions Inc.",
      value: 150000.00,
      remainingAmount: 75000.00,
      startDate: "2024-01-15",
      endDate: "2026-01-14",
      length: "24 months",
      status: "Active",
      documents: [
        {
          id: 1,
          name: "Master_Service_Agreement_2024.pdf",
          size: 2457600,
          uploadDate: "2024-01-15"
        },
        {
          id: 2,
          name: "Service_Level_Agreement.pdf",
          size: 1843200,
          uploadDate: "2024-01-15"
        },
        {
          id: 3,
          name: "Pricing_Schedule_2024.xlsx",
          size: 524288,
          uploadDate: "2024-01-20"
        }
      ]
    },
    {
      id: 2,
      name: "Software Licensing Agreement",
      vendor: "DataSoft Corporation",
      value: 85000.00,
      remainingAmount: 42500.00,
      startDate: "2024-03-01",
      endDate: "2026-02-28",
      length: "24 months",
      status: "Active",
      documents: [
        {
          id: 4,
          name: "Software_License_Agreement.pdf",
          size: 1572864,
          uploadDate: "2024-03-01"
        },
        {
          id: 5,
          name: "User_Documentation.pdf",
          size: 3145728,
          uploadDate: "2024-03-05"
        }
      ]
    },
    {
      id: 3,
      name: "Marketing Services Contract",
      vendor: "Creative Marketing Group",
      value: 45000.00,
      remainingAmount: 15000.00,
      startDate: "2023-06-01",
      endDate: "2024-05-31",
      length: "12 months",
      status: "Expired",
      documents: [
        {
          id: 6,
          name: "Marketing_Services_Contract.pdf",
          size: 1048576,
          uploadDate: "2023-06-01"
        }
      ]
    },
    {
      id: 4,
      name: "Office Equipment Lease",
      vendor: "Business Equipment Rentals LLC",
      value: 32000.00,
      remainingAmount: 24000.00,
      startDate: "2025-01-01",
      endDate: "2026-12-31",
      length: "24 months",
      status: "Pending",
      documents: [
        {
          id: 7,
          name: "Equipment_Lease_Agreement.pdf",
          size: 2097152,
          uploadDate: "2024-12-15"
        },
        {
          id: 8,
          name: "Equipment_Inventory_List.xlsx",
          size: 786432,
          uploadDate: "2024-12-15"
        }
      ]
    },
    {
      id: 5,
      name: "Consulting Services Agreement",
      vendor: "Strategic Advisors Inc.",
      value: 120000.00,
      remainingAmount: 80000.00,
      startDate: "2024-02-01",
      endDate: "2026-01-31",
      length: "24 months",
      status: "Active",
      documents: [
        {
          id: 9,
          name: "Consulting_Agreement_2024.pdf",
          size: 1310720,
          uploadDate: "2024-02-01"
        },
        {
          id: 10,
          name: "Statement_of_Work.docx",
          size: 655360,
          uploadDate: "2024-02-05"
        },
        {
          id: 11,
          name: "Deliverables_Schedule.pdf",
          size: 917504,
          uploadDate: "2024-02-10"
        }
      ]
    }
  ];

  useEffect(() => {
    if (!contractId) {
      navigate('/contract-dashboard');
      return;
    }

    setTimeout(() => {
      const foundContract = mockContracts?.find(c => c?.id === contractId);
      if (foundContract) {
        setContract(foundContract);
      } else {
        navigate('/contract-dashboard');
      }
      setLoading(false);
    }, 500);
  }, [contractId, navigate]);

  const handleDelete = async (id) => {
    console.log('Deleting contract:', id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate('/contract-dashboard');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary text-sm md:text-base">Loading contract details...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
          <Breadcrumb />

          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-2">
              {contract?.name}
            </h1>
            <p className="text-sm md:text-base text-text-secondary">
              View complete contract information and attached documents
            </p>
          </div>

          <div className="mb-6 md:mb-8">
            <ActionButtons contractId={contract?.id} onDelete={handleDelete} />
          </div>

          <div className="space-y-6 md:space-y-8">
            <ContractInfoSection contract={contract} />
            <DocumentSection documents={contract?.documents} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ContractDetails;