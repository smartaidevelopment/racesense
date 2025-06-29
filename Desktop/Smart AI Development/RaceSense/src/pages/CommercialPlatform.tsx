// Commercial Racing Platform Interface
// Racing team licensing, professional analytics, hardware marketplace, racing schools

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building,
  Trophy,
  ShoppingCart,
  GraduationCap,
  Star,
  Users,
  Shield,
  Crown,
  Package,
  Cpu,
  Phone,
  Globe,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Award,
  BookOpen,
} from "lucide-react";

import commercialRacingService, {
  RacingTeamLicense,
  ProfessionalAnalyticsPackage,
  HardwareProduct,
  HardwareVendor,
  RacingSchool,
  DriverDevelopmentProgram,
} from "../services/CommercialRacingService";

const CommercialPlatformPage: React.FC = () => {
  const [licenses, setLicenses] = useState<RacingTeamLicense[]>([]);
  const [analyticsPackages, setAnalyticsPackages] = useState<
    ProfessionalAnalyticsPackage[]
  >([]);
  const [hardwareProducts, setHardwareProducts] = useState<HardwareProduct[]>(
    [],
  );
  const [hardwareVendors, setHardwareVendors] = useState<HardwareVendor[]>([]);
  const [racingSchools, setRacingSchools] = useState<RacingSchool[]>([]);
  const [developmentPrograms, setDevelopmentPrograms] = useState<
    DriverDevelopmentProgram[]
  >([]);
  const [selectedLicenseType, setSelectedLicenseType] =
    useState<RacingTeamLicense["licenseType"]>("starter");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const packages = await commercialRacingService.getAvailablePackages();
      const products = await commercialRacingService.getMarketplaceProducts();
      const vendors = await commercialRacingService.getMarketplaceVendors();
      const schools = await commercialRacingService.getRacingSchools();

      setAnalyticsPackages(packages);
      setHardwareProducts(products);
      setHardwareVendors(vendors);
      setRacingSchools(schools);
    } catch (error) {
      console.error("Failed to load commercial data:", error);
    }
  };

  const createTeamLicense = async (teamName: string) => {
    try {
      const license = await commercialRacingService.createTeamLicense(
        teamName,
        selectedLicenseType,
      );
      setLicenses((prev) => [license, ...prev]);
      alert(`License created successfully for ${teamName}!`);
    } catch (error) {
      console.error("Failed to create license:", error);
      alert("Failed to create license");
    }
  };

  const createDevelopmentProgram = async () => {
    try {
      const program = await commercialRacingService.createDevelopmentProgram(
        "driver-123",
        "talent_development",
        "club",
        "professional",
      );
      setDevelopmentPrograms((prev) => [program, ...prev]);
      alert("Development program created successfully!");
    } catch (error) {
      console.error("Failed to create development program:", error);
      alert("Failed to create development program");
    }
  };

  const getLicenseTypeColor = (type: string): string => {
    switch (type) {
      case "starter":
        return "bg-blue-500";
      case "professional":
        return "bg-purple-500";
      case "enterprise":
        return "bg-gold-500 text-black";
      case "custom":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "trial":
        return "bg-blue-500";
      case "suspended":
        return "bg-orange-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-400"
        }`}
      />
    ));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gold-500 to-orange-500 bg-clip-text text-transparent">
            Commercial Racing Platform
          </h1>
          <p className="text-gray-400">
            Professional racing team licensing, analytics, hardware marketplace,
            and driver development
          </p>
        </div>

        <Tabs defaultValue="licensing" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="licensing">Team Licensing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="marketplace">Hardware</TabsTrigger>
            <TabsTrigger value="schools">Racing Schools</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>

          {/* Team Licensing */}
          <TabsContent value="licensing" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-400" />
                  Racing Team Licensing System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* License Plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      type: "starter" as const,
                      name: "Starter",
                      price: "$99/month",
                      icon: <Users className="h-6 w-6" />,
                      features: [
                        "5 drivers max",
                        "2 vehicles max",
                        "6 months data retention",
                        "Basic hardware integration",
                        "Email support",
                      ],
                      popular: false,
                    },
                    {
                      type: "professional" as const,
                      name: "Professional",
                      price: "$299/month",
                      icon: <Shield className="h-6 w-6" />,
                      features: [
                        "20 drivers max",
                        "10 vehicles max",
                        "24 months data retention",
                        "Advanced analytics",
                        "API access",
                        "Priority support",
                        "Live streaming",
                      ],
                      popular: true,
                    },
                    {
                      type: "enterprise" as const,
                      name: "Enterprise",
                      price: "$999/month",
                      icon: <Crown className="h-6 w-6" />,
                      features: [
                        "100 drivers max",
                        "50 vehicles max",
                        "60 months data retention",
                        "White label branding",
                        "Custom domain",
                        "Dedicated support",
                        "Full API access",
                      ],
                      popular: false,
                    },
                    {
                      type: "custom" as const,
                      name: "Custom",
                      price: "Contact us",
                      icon: <Trophy className="h-6 w-6" />,
                      features: [
                        "Unlimited everything",
                        "Custom development",
                        "24/7 dedicated support",
                        "On-site integration",
                        "Training included",
                      ],
                      popular: false,
                    },
                  ].map((plan) => (
                    <Card
                      key={plan.type}
                      className={`bg-gray-700 border-gray-600 relative ${
                        plan.popular ? "ring-2 ring-purple-500" : ""
                      }`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                          Most Popular
                        </Badge>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          {plan.icon}
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                        </div>
                        <div className="text-2xl font-bold text-blue-400">
                          {plan.price}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                          onClick={() => setSelectedLicenseType(plan.type)}
                        >
                          Select Plan
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Create License */}
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle>Create Team License</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Team Name</Label>
                        <Input placeholder="Enter team name" id="teamName" />
                      </div>
                      <div>
                        <Label>License Type</Label>
                        <Select
                          value={selectedLicenseType}
                          onValueChange={(value) =>
                            setSelectedLicenseType(
                              value as RacingTeamLicense["licenseType"],
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="professional">
                              Professional
                            </SelectItem>
                            <SelectItem value="enterprise">
                              Enterprise
                            </SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={() => {
                            const teamName = (
                              document.getElementById(
                                "teamName",
                              ) as HTMLInputElement
                            )?.value;
                            if (teamName) {
                              createTeamLicense(teamName);
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Create License
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Licenses */}
                {licenses.length > 0 && (
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle>Active Licenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {licenses.map((license) => (
                          <div
                            key={license.id}
                            className="p-4 bg-gray-600 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-semibold">
                                  {license.teamName}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {license.licenseType}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge
                                  className={getLicenseTypeColor(
                                    license.licenseType,
                                  )}
                                >
                                  {license.licenseType}
                                </Badge>
                                <Badge
                                  className={getStatusColor(license.status)}
                                >
                                  {license.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Drivers:</span>
                                <div>
                                  {license.usage.drivers}/
                                  {license.features.maxDrivers}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Vehicles:</span>
                                <div>
                                  {license.usage.vehicles}/
                                  {license.features.maxVehicles}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Sessions:</span>
                                <div>{license.usage.sessions}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Valid Until:
                                </span>
                                <div>
                                  {license.validUntil.toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-gray-400">
                              Monthly: {formatCurrency(license.pricing.monthly)}{" "}
                              • Annual: {formatCurrency(license.pricing.annual)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Analytics Packages */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  Professional Data Analytics Packages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analyticsPackages.map((pkg) => (
                    <Card key={pkg.id} className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <Badge className="bg-purple-500 text-white">
                            {pkg.complexity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          {pkg.description}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="text-lg font-bold text-green-400">
                            {formatCurrency(pkg.pricing.base_price)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Base price +{" "}
                            {formatCurrency(pkg.pricing.per_metric)} per custom
                            metric
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Features:</h5>
                          <div className="flex flex-wrap gap-1">
                            {pkg.features.slice(0, 4).map((feature, i) => (
                              <Badge
                                key={i}
                                className="bg-gray-600 text-white text-xs"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Includes:</h5>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              {pkg.metrics.included.length} standard metrics
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              {pkg.reports.templates.length} report templates
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-400" />
                              {pkg.integrations.third_party.length} integrations
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-400">
                            Target: {pkg.target_audience.join(", ")}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-gray-400">
                            Implementation: {pkg.implementation_time}
                          </span>
                        </div>

                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          Purchase Package
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hardware Marketplace */}
          <TabsContent value="marketplace" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-orange-400" />
                  Hardware Integration Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vendors */}
                <div>
                  <h4 className="font-semibold text-orange-400 mb-4">
                    Certified Vendors
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hardwareVendors.map((vendor) => (
                      <Card
                        key={vendor.id}
                        className="bg-gray-700 border-gray-600"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-semibold">{vendor.name}</div>
                              <div className="text-sm text-gray-400">
                                {vendor.type} • {vendor.location.country}
                              </div>
                            </div>
                            <Badge
                              className={
                                vendor.integration_status === "certified"
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }
                            >
                              {vendor.integration_status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex">
                              {getRatingStars(Math.floor(vendor.rating))}
                            </div>
                            <span className="text-sm">
                              {vendor.rating} ({vendor.reviews} reviews)
                            </span>
                          </div>

                          <div className="text-sm text-gray-400 mb-3">
                            Specialties: {vendor.specialties.join(", ")}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Globe className="h-4 w-4" />
                              <span>Website</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{vendor.contact.support_hours}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="font-semibold text-orange-400 mb-4">
                    Featured Products
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {hardwareProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="bg-gray-700 border-gray-600"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {product.name}
                            </CardTitle>
                            <Badge
                              className={
                                product.pricing.availability === "in_stock"
                                  ? "bg-green-500"
                                  : "bg-orange-500"
                              }
                            >
                              {product.pricing.availability.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400">
                            {product.category} • {product.type}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-300">
                            {product.description}
                          </p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">
                                Sampling Rate:
                              </span>
                              <div>{product.specifications.sampling_rate}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Accuracy:</span>
                              <div>{product.specifications.accuracy}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">
                                Connectivity:
                              </span>
                              <div>
                                {product.specifications.connectivity.join(", ")}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-400">IP Rating:</span>
                              <div>{product.specifications.ip_rating}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {getRatingStars(
                                Math.floor(product.reviews.average_rating),
                              )}
                            </div>
                            <span className="text-sm">
                              {product.reviews.average_rating} (
                              {product.reviews.total_reviews} reviews)
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-green-400">
                                {formatCurrency(product.pricing.retail)}
                              </div>
                              <div className="text-sm text-gray-400">
                                Bulk: {formatCurrency(product.pricing.bulk)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">
                              Setup: {product.integration.setup_time}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Buy Now
                            </Button>
                            <Button
                              variant="outline"
                              className="border-gray-600"
                            >
                              Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Racing Schools */}
          <TabsContent value="schools" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-400" />
                  Racing School Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {racingSchools.map((school) => (
                    <Card
                      key={school.id}
                      className="bg-gray-700 border-gray-600"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {school.name}
                            </CardTitle>
                            <div className="text-sm text-gray-400">
                              {school.location?.city},{" "}
                              {school.location?.country} • Established{" "}
                              {school.established}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              {getRatingStars(Math.floor(school.rating))}
                              <span className="text-sm">
                                {school.rating} ({school.reviews})
                              </span>
                            </div>
                            {school.integration.racesense_partner && (
                              <Badge className="bg-green-500 text-white mt-1">
                                RaceSense Partner
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-sm text-gray-400">
                            Specialties:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {school.specialties.map((specialty, i) => (
                              <Badge
                                key={i}
                                className="bg-green-600 text-white text-xs"
                              >
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-400">Levels:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {school.levels.map((level, i) => (
                              <Badge
                                key={i}
                                className="bg-blue-600 text-white text-xs"
                              >
                                {level}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {school.location?.tracks && (
                          <div>
                            <span className="text-sm text-gray-400">
                              Tracks:
                            </span>
                            <div className="text-sm">
                              {school.location.tracks.join(", ")}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {school.programs.slice(0, 2).map((program) => (
                            <div
                              key={program.id}
                              className="p-3 bg-gray-600 rounded"
                            >
                              <div className="font-semibold mb-1">
                                {program.name}
                              </div>
                              <div className="text-sm text-gray-400 mb-2">
                                {program.duration} • {program.format}
                              </div>
                              <div className="text-sm mb-2">
                                {program.curriculum.practical_hours}h practical
                                + {program.curriculum.theory_hours}h theory
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-green-400">
                                  {formatCurrency(program.price)}
                                </div>
                                <Badge className="bg-blue-500 text-white">
                                  {program.skill_level}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-gray-400">
                            Consultation:{" "}
                            {formatCurrency(school.pricing.consultation)} •
                            Hourly: {formatCurrency(school.pricing.hourly_rate)}
                          </div>
                          <Button className="bg-green-600 hover:bg-green-700">
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Programs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Driver Development Programs */}
          <TabsContent value="development" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-400" />
                  Professional Driver Development Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <Button
                    onClick={createDevelopmentProgram}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Create Development Program
                  </Button>
                </div>

                {developmentPrograms.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-purple-400">
                      Active Programs
                    </h4>
                    {developmentPrograms.map((program) => (
                      <Card
                        key={program.id}
                        className="bg-gray-700 border-gray-600"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {program.program_type.replace("_", " ")}
                              </CardTitle>
                              <div className="text-sm text-gray-400">
                                {program.current_level} → {program.target_level}
                              </div>
                            </div>
                            <Badge className="bg-purple-500 text-white">
                              Active
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-gray-400">
                                Start Date:
                              </span>
                              <div>
                                {program.timeline.start_date.toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">
                                Target Completion:
                              </span>
                              <div>
                                {program.timeline.target_completion.toLocaleDateString()}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm text-gray-400">
                                Total Cost:
                              </span>
                              <div className="text-lg font-bold text-green-400">
                                {formatCurrency(program.cost.total)}
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-gray-400">
                              Curriculum Areas:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.keys(program.curriculum).map(
                                (area, i) => (
                                  <Badge
                                    key={i}
                                    className="bg-blue-600 text-white text-xs"
                                  >
                                    {area.replace("_", " ")}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-gray-400">
                              Resources Included:
                            </span>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                Simulator Access
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                {program.resources.track_time}h Track Time
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                Data Analysis
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                Video Review
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            {program.timeline.milestones.map((milestone, i) => (
                              <div
                                key={i}
                                className="text-center p-2 bg-gray-600 rounded text-sm"
                              >
                                <div className="font-semibold">
                                  Milestone {i + 1}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {milestone.date.toLocaleDateString()}
                                </div>
                                <div className="text-xs">
                                  {milestone.completed ? (
                                    <CheckCircle className="h-4 w-4 text-green-400 mx-auto" />
                                  ) : (
                                    <Calendar className="h-4 w-4 text-gray-400 mx-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="text-sm text-gray-400">
                            Mentorship: {program.mentorship.session_frequency}{" "}
                            sessions via{" "}
                            {program.mentorship.communication_method}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommercialPlatformPage;
