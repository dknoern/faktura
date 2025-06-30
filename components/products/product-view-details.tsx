"use client"

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductHistory } from "./product-history";
import { Watch, Gem, BriefcaseBusiness, Clock} from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
interface ProductViewDetailsProps {
  product: any;
  repairs: any[];
}

// Component to display manufacturer logo
function ManufacturerLogo({ manufacturer }: { manufacturer: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Add timeout to handle hanging requests - MUST be before any early returns
  React.useEffect(() => {
    if (!manufacturer) return; // Don't set timeout if no manufacturer
    
    const timeout = setTimeout(() => {
      if (!imageLoaded && !imageError) {
        console.log('Image load timeout, falling back to text');
        setImageError(true);
      }
    }, 3000); // 3 second timeout
    
    return () => clearTimeout(timeout);
  }, [manufacturer, imageLoaded, imageError]);
  
  if (!manufacturer) {
    return <p/>;
  }
  
  if (imageError) {
    return <p>{manufacturer}</p>;
  }
  
  // Create the logo path - no encoding needed with catch-all route
  const logoPath = `logos/${manufacturer}.png`;
  const imageUrl = `/api/images/${logoPath}`;
  
  return (
    <div className="flex items-center">
      {!imageLoaded && !imageError && (
        <p className="text-gray-400">Loading logo...</p>
      )}
      <img
        src={imageUrl}
        alt={`${manufacturer} logo`}
        style={{ maxWidth: '120px', height: 'auto', objectFit: 'contain' }}
        className={!imageLoaded ? 'hidden' : ''}
        onLoad={() => {
          setImageLoaded(true);
        }}
        onError={() => {
          setImageError(true);
        }}
      />
    </div>
  );
}

export function ProductViewDetails({ product, repairs }: ProductViewDetailsProps) {
  const formatCurrency = (amount: number) => {
    return Math.ceil(amount).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).replace('.00', '');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const getProductTypeIcon = (productType: string) => {
    const className="size-4 ml-0 mr-2"
    switch (productType) {
      case 'Watch':
        return <Watch className={className} />;
      case 'PocketWatch':
        return <Clock className={className} />;
      case 'Jewelry':
        return <Gem className={className} />;
      case 'Accessories':
        return <BriefcaseBusiness className={className} />;
      default:
        return <Watch className={className} />;
    }
  };

  // Calculate total repair cost from associated repairs
  const totalRepairCost = repairs && repairs.length > 0 
    ? repairs.reduce((total: number, repair: any) => {
        const repairCost = repair.cost || repair.repairCost || 0;
        return total + repairCost;
      }, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">

            <div className="col-span-2">
              {/*<label className="text-sm font-medium text-gray-500">Manufacturer</label>*/}
              <div className="mt-1">
                <ManufacturerLogo manufacturer={product.manufacturer} />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p>{product.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <div className="mt-1"><Badge>{getProductTypeIcon(product.productType)} {product.productType}</Badge></div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1 flex gap-2">
                <Badge style={{ 
                  backgroundColor: product.status === 'In Stock' ? 'green' : 
                                 product.status === 'Sold' ? 'grey' : 
                                 product.status === 'Incoming' ? 'teal' : 
                                 product.status === 'Sale Pending' ? 'red' : 'orange' 
                }}>
                  {product.sellerType === 'Partner' && product.status !== 'Sold' ? 'Partnership' : product.status}
                </Badge>
                {product.ebayNoReserve && <Badge style={{ backgroundColor: 'blue' }}>Ebay</Badge>}
                {product.inventoryItem && <Badge style={{ backgroundColor: 'green' }}>Inventory</Badge>}
                {product.sellerType === "Partner" && product.id != null && <div style={{ fontSize: '14px', cursor: 'pointer' }} className="text-blue-500 hover:underline"><Link href={`/invoices/${product.id}/partner`}>Partner Invoice</Link></div>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Serial Number</label>
              <p>{product.serialNo || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Model Name</label>
              <p>{product.model || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Model Number</label>
              <p>{product.modelNumber || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Condition</label>
              <p>{product.condition || 'N/A'}</p>
            </div>


            <div>
              <label className="text-sm font-medium text-gray-500">Gender</label>
              <p>{product.gender || 'N/A'}</p>
            </div>


            <div>
              <label className="text-sm font-medium text-gray-500">Features</label>
              <p>{product.features || 'N/A'}</p>
            </div>


            <div>
              <label className="text-sm font-medium text-gray-500">Case</label>
              <p>{product.case || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Dial</label>
              <p>{product.dial || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Bracelet</label>
              <p>{product.bracelet || 'N/A'}</p>
            </div>

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Long Desc</label>
              <p>{product.longDesc || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Movement</label>
              <p>{product.movement || 'N/A'}</p>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-500">Our Price</span>
              <span className="text-sm font-semibold">
                {product.sellingPrice ? formatCurrency(product.sellingPrice) : '$0.00'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-500">List Price</span>
              <span className="text-sm font-semibold">
                {product.listPrice ? formatCurrency(product.listPrice) : '$0.00'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-500">Cost</span>
              <span className="text-sm font-semibold">
                {product.cost ? formatCurrency(product.cost) : '$0.00'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium text-gray-500">Repair Cost</span>
              <span className="text-sm font-semibold">
                {totalRepairCost > 0 ? formatCurrency(totalRepairCost) : '$0.00'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-500">Total Cost</span>
              <span className="text-sm font-semibold">
                {(product.cost || 0) + totalRepairCost > 0 ? formatCurrency((product.cost || 0) + totalRepairCost) : '$0.00'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Information */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Seller</label>
              <p>{product.seller || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Seller Type</label>
              <p>{product.sellerType || 'N/A'}</p>
            </div>


          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {product.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{product.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Product History */}
      <Card>
        <CardHeader>
          <CardTitle>Product History</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductHistory history={product.history || []} />
        </CardContent>
      </Card>

      {/* Repairs */}
      {repairs && repairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Repairs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {repairs.map((repair: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Repair #{repair.repairNumber}</p>
                    <p className="text-sm text-gray-600">{repair.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{formatDate(repair.dateCreated)}</p>
                    <Badge variant={repair.returnDate ? "secondary" : "default"}>
                      {repair.returnDate ? "Returned" : "Outstanding"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
