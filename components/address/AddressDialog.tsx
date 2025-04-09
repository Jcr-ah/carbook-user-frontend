import React, { useEffect, useState } from 'react';
import Dialog from './Dialog';
import AddressFields, { AddressData } from './AddressFields';
import { useUserStore } from '@/lib/store';
import axios from 'axios';
import { BASE_URL } from '@/lib/config';
import { toast } from '@/hooks/use-toast';
import { Button } from '../ui/button';

interface AddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
}

interface FormErrors {
  [key: string]: string;
}

export default function AddressDialog({ isOpen, onClose, address, setAddress}: AddressDialogProps) {
    const [formData, setFormData] = useState<AddressData>({
                                        buildingInfo: '',
                                        streetInfo: '',
                                        landmark: '',
                                        city: '',
                                        state: '',
                                        pincode: '',
                                        });
    const [isValidPincode, setIsValidPincode] = useState(false);
    const {name,setName} = useUserStore()
    const [contact,setContact] = useState("");
    const [errors,setErrors] = useState<FormErrors>({});
    const [isLoading,setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: FormErrors = {};
        if (formData.buildingInfo === "") newErrors.buildingInfo = "This field is mandatory";
        if (formData.streetInfo === "") newErrors.streetInfo = "This field is mandatory";
        if (formData.landmark === "") newErrors.landmark = "This field is mandatory";
        if (formData.pincode === "") newErrors.pincode = "This field is mandatory";
        if (formData.city === "") newErrors.city = "This field is mandatory";
        if (formData.state === "") newErrors.state = "This field is mandatory";
        if (!isValidPincode) newErrors.pincode = "Please enter valid Pin or postal code.";
        if (contact === "") newErrors.contact = "This field is mandatory"
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    function concatenateAddressValues(): string {
        return Object.values(formData).join(', ');
    };

    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidPincode) {
            toast({
                description: `Please enter valid Pin or postal code.`,
                variant: "destructive",
                duration: 2000,
            });
            return;
        }
        if (!validateForm()) {
            toast({
                description: `Please fill all mandatory fields`,
                variant: "destructive",
                duration: 2000,
                });
                return;
        }
        setIsLoading(true);
        const newAddress = concatenateAddressValues();

        try {
            await axios.put(
            `${BASE_URL}/api/v1/customer/me`,
            {
                address : newAddress,
                contact: contact !== "" ? contact : undefined,
            },
            {
                headers: {
                "Content-type": "application/json",
                authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            },
            );
            setIsLoading(false);
            toast({
                title:"Successfully added address"
            })
            setAddress(newAddress);
            onClose();
        }
        catch(err){
            console.log(err);
            toast({
                title:"something went wrong",
                variant:"destructive"
            })
        }
        setIsLoading(false);
    };

    useEffect(() => {
      function parseAddressData(): AddressData | null {
        const addressArray = address.split(", ");
        
        if (addressArray.length !== 6) {
          console.error("Invalid address format. Expected exactly 6 elements.");
          return null;
        }
      
        return {
          buildingInfo: addressArray[0] || '',
          streetInfo: addressArray[1] || '',
          landmark: addressArray[2] || '',
          pincode: addressArray[3] || '',
          city: addressArray[4] || '',
          state: addressArray[5] || ''
        };
      }
      const fetchData = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/v1/customer/me`, {
            headers: {
              "Content-type": "application/json",
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setContact(res.data.contact);
          const newFormData = parseAddressData();
          if (newFormData) {
            setFormData(newFormData);
          }
        } catch (error) {
          console.log(error);
        }
      }
      fetchData();
      }, [setContact,address,setFormData]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Address Details"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AddressFields
          isValidPincode={isValidPincode}
          setIsValidPincode={setIsValidPincode}
          contact={contact}
          name={name}
          errors={errors}
          setErrors={setErrors}
          formData={formData}
          setFormData={setFormData}
          setContact={setContact}
          setName={setName}
        />
        <div className="flex justify-end space-x-4 mt-6">
          <Button
            type="button"
            variant={"outline"}
            onClick={onClose}
            className=" border bg-transparent border-black/15 dark:border-white/15 rounded-md hover:bg-black/10 max-sm:w-full"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValidPincode || isLoading}
            className={`bg-blue-600 active:scale-95 dark:text-white hover:bg-opacity-80 disabled:bg-opacity-50 disabled:cursor-not-allowed max-sm:w-full`}
        >
            {isLoading ? (
            <>
                <span>Please wait</span>
                <div className="flex items-end py-1 h-full">
                <span className="sr-only">Loading...</span>
                <div className="h-1 w-1 bg-white mx-[2px] border-border rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-1 w-1 bg-white mx-[2px] border-border rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-1 w-1 bg-white mx-[2px] border-border rounded-full animate-bounce"></div>
                </div>
            </>
            ) : (
            <span>Save Address</span>
            )}
        </Button>
        </div>
      </form>
    </Dialog>
  );
}