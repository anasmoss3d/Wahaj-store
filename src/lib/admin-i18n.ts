// Pure admin translation data — no server-only imports, safe for client bundles.

import type { Locale } from "@/lib/dictionary";

export const adminEn = {
  brand: {
    name: "Wahaj",
    subtitle: "Atelier Admin",
    tooltip: "Wahaj Atelier Admin",
    fallbackAdmin: "Wahaj Admin",
    fallbackRole: "Atelier Studio"
  },
  nav: {
    groups: {
      atelier: "Atelier",
      catalog: "Catalog",
      storefront: "Storefront"
    },
    overview: "Overview",
    orders: "Orders",
    products: "Products",
    newProduct: "New product",
    newShort: "New",
    editProduct: "Edit product",
    orderDetails: "Order details",
    categories: "Categories",
    colors: "Colors",
    sizes: "Sizes",
    addons: "Add-ons",
    coupons: "Coupons",
    reviews: "Reviews",
    settings: "Settings",
    viewStorefront: "View Storefront",
    signOut: "Sign out",
    dashboard: "Dashboard",
    toggleSidebar: "Toggle Sidebar",
    toggleSidebarShortcut: "Toggle Sidebar (Ctrl+B)",
    mobileSidebarTitle: "Navigation",
    mobileSidebarDescription: "Admin dashboard navigation"
  },
  common: {
    active: "Active",
    inactive: "Inactive",
    hidden: "Hidden",
    archived: "Archived",
    approved: "Approved",
    pending: "Pending",
    save: "Save",
    saving: "Saving...",
    saveChanges: "Save changes",
    delete: "Delete",
    deleting: "Deleting…",
    confirmDelete: "Delete this item? This cannot be undone.",
    filter: "Filter",
    all: "All",
    egp: "EGP",
    sortOrder: "Sort order",
    imageUrl: "Image URL",
    nameArPrimary: "Name (العربية · Primary)",
    nameEnSecondary: "Name (English · Secondary)",
    descriptionArPrimary: "Description (العربية · Primary)",
    descriptionEnSecondary: "Description (English · Secondary)",
    upload: "Upload",
    uploading: "Uploading...",
    uploadSuccess: "Uploaded. Save this form to apply the image.",
    uploadFailed: "Upload failed. Please try again.",
    previewFailed: "The image URL could not be previewed.",
    networkError: "Network error — please try again."
  },
  overview: {
    kicker: "Atelier Overview",
    title: "Overview",
    subtitle: "Orders, revenue, catalog inventory, and storefront activity.",
    presets: {
      last7: "7D",
      last30: "30D",
      last90: "90D"
    },
    metrics: {
      totalOrders: "Total Orders",
      pendingOrders: "Pending Orders",
      preparingOrders: "Preparing Orders",
      shippedOrders: "Shipped Orders",
      deliveredOrders: "Delivered Orders",
      totalProducts: "Total Products",
      activeProducts: "Active Products",
      customers: "Customers",
      revenue: "Revenue"
    },
    cards: {
      revenueTitle: "Total Revenue",
      rangeRevenue: "In selected range",
      pipelineTitle: "Order Pipeline",
      inProgressLabel: "active queue",
      deliveredLabel: "delivered",
      catalogTitle: "Catalog & Stock",
      activeUnit: "active",
      archivedUnit: "archived",
      stockUnitsLabel: "active units",
      lowStockLabel: "low stock",
      pulseTitle: "Storefront Pulse",
      customersUnit: "customers",
      couponsUnit: "active coupons",
      reviewsUnit: "pending reviews"
    },
    charts: {
      metricRevenue: "Revenue",
      metricOrders: "Orders",
      peakDay: "Peak",
      emptyTrendNote:
        "No orders recorded in this range yet — daily revenue and order curves will populate automatically as orders come in.",
      statusChartSubtitle: "Order status split for selected dates",
      totalLabel: "Total",
      openOrdersLink: "View orders",
      openProductsLink: "Manage catalog",
      catalogMixTitle: "Catalog & Inventory Analytics",
      catalogMixSubtitle: "Category breakdown (active vs. archived) and live active product stock levels.",
      byCategoryHeading: "Products by category",
      activeStockHeading: "Live active stock",
      units: "units",
      avgPrice: "Avg. active price",
      emptyCategoryProducts: "No products",
      configuredColorsHint: "{count} atelier colors ready for product variants",
      configuredAddonsHint: "{count} finishing add-ons enabled at checkout",
      activeCatalogHint: "{count} active products live on the storefront"
    },
    salesInRange: "Sales & Order Trend",
    ordersUnit: "orders",
    aovLabel: "AOV",
    ordersByStatus: "Orders by status",
    noOrdersInRange: "No orders recorded in this range.",
    bestSellers: "Best sellers",
    topColors: "Top colors",
    topAddons: "Top add-ons",
    noSalesInRange: "No sales in this range."
  },
  orders: {
    kicker: "Atelier Fulfillment",
    title: "Orders",
    searchPlaceholder: "Order number, customer, phone",
    allStatuses: "All statuses",
    empty: "No orders found.",
    autoRefreshPrefix: "Auto-refresh on ·",
    autoRefreshChecked: "checked",
    autoRefreshWatching: "watching for new orders",
    insights: {
      totalOrders: "Total Orders",
      activeQueue: "In Progress",
      totalValue: "Gross Value",
      aov: "Average Order",
      pipelineTitle: "Status Distribution",
      last14Days: "Last 14 Days Volume",
      noRecentOrders: "No orders placed in the last 14 days yet."
    },
    columns: {
      order: "Order",
      customer: "Customer",
      phone: "Phone",
      total: "Total",
      status: "Status",
      date: "Date"
    }
  },
  orderDetail: {
    kicker: "Order Dossier",
    deleteOrder: "Delete order",
    payment: "Payment",
    instapayPrepaid: "InstaPay (prepaid)",
    cashOnDelivery: "Cash on Delivery",
    receiptAlt: "Payment receipt",
    noReceipt: "No receipt uploaded",
    itemsAndCustomization: "Items and customization",
    qty: "Qty",
    size: "Size",
    base: "Base",
    color: "Color",
    setQty: "Set qty",
    zeroRemovesItem: "0 removes the item",
    statusHistory: "Status history",
    editCustomerDetails: "Edit customer details",
    customerName: "Customer name",
    phone: "Phone",
    whatsapp: "WhatsApp",
    email: "Email",
    governorate: "Governorate",
    city: "City",
    fullAddress: "Full address",
    building: "Building",
    customerNotes: "Customer notes",
    internalNotes: "Internal notes",
    customer: "Customer",
    address: "Address",
    notProvided: "Not provided",
    notes: "Notes",
    noNotes: "No notes",
    totals: "Totals",
    subtotal: "Subtotal",
    discount: "Discount",
    shipping: "Shipping",
    total: "Total",
    updateStatus: "Update status",
    status: "Status",
    internalNote: "Internal note"
  },
  products: {
    kicker: "Atelier Inventory",
    title: "Products",
    subtitle: "Manage products, color images, add-ons, prices, stock, and archive visibility.",
    newProduct: "New product",
    filterAriaLabel: "Product status filter",
    tabs: {
      all: "All",
      active: "Active",
      archived: "Archived"
    },
    empty: {
      archivedTitle: "No archived products",
      activeTitle: "No active products",
      allTitle: "No products yet",
      archivedHint: "Archived products will appear here and remain hidden from customers until restored.",
      defaultHint: "Use the filter above or create a new product to populate the storefront."
    },
    fields: {
      category: "Category",
      price: "Price",
      stock: "Stock",
      options: "Options",
      product: "Product",
      status: "Status",
      actions: "Actions",
      colorsWord: "colors",
      addonsWord: "add-ons"
    },
    deleteConfirmPrefix: "Delete",
    deleteConfirmSuffix: "This removes it from the store for good.",
    deleteError: "Could not delete product.",
    archive: "Archive",
    archiving: "Archiving…",
    restore: "Restore",
    restoring: "Restoring…",
    archiveAriaPrefix: "Archive",
    restoreAriaPrefix: "Restore",
    statusUpdateError: "Could not update product status.",
    insights: {
      catalogRatio: "Live Catalog Ratio",
      unitsInStock: "Total Stock Units",
      inventoryValue: "Stock Valuation",
      lowStock: "Low Stock (≤ 5)",
      stockByProduct: "Active Stock & Price Spread",
      categorySplit: "Category Distribution"
    },
    newPage: {
      kicker: "Atelier Creation",
      title: "New product",
      subtitle: "Create a product without touching code."
    },
    editPage: {
      kicker: "Atelier Editor",
      title: "Edit product"
    },
    form: {
      readiness: {
        title: "Product Readiness",
        completeLabel: "{done}/{total} ready",
        priceSpread: "Customer range",
        checks: {
          arName: "Arabic name",
          enName: "English name",
          category: "Category",
          pricingStock: "Price & stock",
          photo: "Main photo",
          seo: "Bilingual SEO",
          options: "Colors / sizes / add-ons"
        }
      },
      steps: {
        basic: "Basic",
        images: "Images",
        colors: "Colors",
        sizes: "Sizes",
        addons: "Add-ons",
        seo: "SEO",
        preview: "Preview"
      },
      slug: "Slug",
      slugHint: "Auto-generated. Leave blank and the server will create one from the name/SKU.",
      sku: "SKU",
      skuHint: "Auto-generated from the product name. No need to fill this in — the unique code is created for you on save.",
      category: "Category",
      chooseCategory: "Choose category",
      basePrice: "Base price",
      stockQuantity: "Stock quantity",
      flags: {
        active: "Active (visible in store)",
        featured: "Featured",
        bestSeller: "Best seller"
      },
      mainPhoto: "Storefront main photo",
      mainPhotoHint: "This photo appears on product cards and when the product link is shared.",
      gallery: "Gallery",
      addImage: "Add image",
      altArPrimary: "Alt text (العربية · Primary)",
      altEnSecondary: "Alt text (English · Secondary)",
      mainPhotoBadge: "Main photo",
      useAsMainPhoto: "Use as main photo",
      remove: "Remove",
      noColorsSelected: "No colors selected — this is fine. You can still save and publish the product without colors.",
      colorsSelectedCount: "{count} color option(s) selected. Customers without a color requirement can skip this step entirely.",
      additionalPrice: "Additional price",
      variantImage: "Variant image",
      noSizesSelected: "No sizes selected — customers can add the product as-is. Pick a size to require customers to choose one.",
      sizesSelectedCount: "{count} size option(s) selected. Customers must pick one size, and each size has its own full price.",
      noSizesExist: "No sizes exist yet. Create them under Sizes first.",
      fullPriceForProduct: "Full price for this product",
      seoTitleAr: "SEO title (العربية · Primary)",
      seoTitleEn: "SEO title (English · Secondary)",
      metaDescriptionAr: "Meta description (العربية · Primary)",
      metaDescriptionEn: "Meta description (English · Secondary)",
      canonicalUrl: "Canonical URL",
      untitledProduct: "Untitled product",
      previewSummary:
        "{name} will publish with {colors} color option(s), {sizes} size option(s), {addons} add-on(s), stock {stock}, and base price {price} EGP.",
      saveError: "Could not save product.",
      previous: "Previous",
      next: "Next",
      saveProduct: "Save product"
    }
  },
  categories: {
    kicker: "Atelier Organization",
    title: "Categories",
    createSubmit: "Create category",
    nameArPlaceholder: "مثال: شموع الصويا",
    nameEnPlaceholder: "e.g. Candles",
    slug: "Slug",
    currentTitle: "Current categories",
    insights: {
      totalCategories: "Categories",
      activeCategories: "Active",
      assignedProducts: "Total Products",
      breakdownTitle: "Products by Category",
      activeLabel: "Active",
      archivedLabel: "Archived",
      emptyWord: "Empty"
    }
  },
  colors: {
    kicker: "Material Palette",
    title: "Colors",
    createSubmit: "Create color",
    nameArPlaceholder: "مثال: أبيض دافئ",
    nameEnPlaceholder: "e.g. Warm White",
    hexCode: "Hex code",
    currentTitle: "Current colors",
    insights: {
      totalColors: "Colors",
      activeColors: "Active",
      linkedVariants: "Linked Product Options",
      usageTitle: "Color Adoption Across Products",
      productsWord: "products"
    }
  },
  sizes: {
    kicker: "Vessel Weights",
    title: "Sizes",
    subtitle:
      "Shared product sizes (for example 50g, 100g, 150g). Each product can pick a subset of them and set its own full price per size.",
    createSubmit: "Create size",
    nameArPlaceholder: "مثال: ١٠٠ جم",
    nameEnPlaceholder: "e.g. 100g",
    currentTitle: "Current sizes",
    empty: "No sizes yet. Create one on the left, then attach it to any product.",
    insights: {
      totalSizes: "Sizes",
      activeSizes: "Active",
      linkedVariants: "Product Variants",
      adoptionTitle: "Size Usage & Stock Coverage",
      variantsWord: "products"
    }
  },
  addons: {
    kicker: "Atelier Finishing",
    title: "Add-ons",
    createSubmit: "Create add-on",
    nameArPlaceholder: "مثال: ورق ذهب",
    nameEnPlaceholder: "e.g. Gold Leaf",
    price: "Price",
    currentTitle: "Current add-ons",
    insights: {
      totalAddons: "Add-ons",
      activeAddons: "Active",
      priceRange: "Price Range",
      attachedProducts: "Product Attachments",
      comparisonTitle: "Add-on Price & Adoption Chart",
      productsWord: "products"
    }
  },
  coupons: {
    kicker: "Atelier Offers",
    title: "Coupons",
    subtitle: "Percent or fixed discounts validated server-side at checkout. Usage is counted on order creation.",
    createSubmit: "Create coupon",
    code: "Code",
    codePlaceholder: "WELCOME10",
    type: "Type",
    percentOption: "Percent %",
    fixedOption: "Fixed EGP",
    value: "Value",
    minSubtotal: "Min subtotal",
    maxUses: "Max uses (empty = unlimited)",
    startsAt: "Starts at",
    endsAt: "Ends at",
    currentTitle: "Current coupons",
    minPrefix: "min",
    usedPrefix: "used",
    insights: {
      activeCoupons: "Active Offers",
      totalRedemptions: "Total Redemptions",
      totalCapacity: "Tracked Capacity",
      utilizationTitle: "Coupon Capacity & Redemption Rate",
      unlimitedLabel: "Unlimited",
      expiredLabel: "Expired",
      scheduledLabel: "Scheduled"
    }
  },
  reviews: {
    kicker: "Customer Voices",
    title: "Reviews",
    subtitle: "Customer reviews need approval before appearing on product pages.",
    empty: "No reviews yet.",
    approve: "Approve",
    insights: {
      totalReviews: "Total Reviews",
      avgRating: "Average Score",
      pendingModeration: "Needs Approval",
      approvedCount: "Published",
      distributionTitle: "Star Rating Distribution",
      tabs: {
        all: "All",
        pending: "Pending",
        approved: "Approved"
      }
    }
  },
  settings: {
    kicker: "Atelier Configuration",
    title: "Store settings",
    subtitle: "Theme, shipping, social, and contact details are stored in the database.",
    saveSubmit: "Save settings",
    flatShippingRate: "Flat shipping rate (fallback)",
    freeShippingThreshold: "Free shipping threshold (0 = disabled)",
    whatsappNumber: "WhatsApp number",
    primaryColor: "Primary color",
    secondaryColor: "Secondary color",
    heroImage: "Homepage hero image",
    contactEmail: "Contact email",
    instapayHandle: "InstaPay handle (e.g. name@instapay)",
    instapayLink: "InstaPay payment link (tap-to-pay)",
    instapayQrImage: "InstaPay QR image",
    instapayQrPreviewAlt: "InstaPay QR preview",
    telegramChatId: "Telegram chat ID for order alerts (bot token goes in TELEGRAM_BOT_TOKEN env)",
    shippingByGovernorate: "Shipping by governorate",
    shippingByGovernorateHint:
      "Orders use the matching rate, otherwise the flat fallback. Free shipping threshold applies first.",
    saveRate: "Save rate",
    rate: "Rate",
    insights: {
      activeGovernorates: "Active Zones",
      avgRate: "Average Shipping",
      rateSpread: "Min–Max Rate",
      freeThreshold: "Free Shipping At",
      disabledLabel: "Disabled",
      shippingChartTitle: "Governorate Rate Comparison",
      channelHealthTitle: "Storefront Channels",
      instapayLabel: "InstaPay",
      qrLabel: "InstaPay QR",
      telegramLabel: "Telegram Bot",
      brandPaletteLabel: "Theme Swatches",
      readyLabel: "Configured",
      missingLabel: "Not set"
    }
  },
  forbidden: {
    title: "Access restricted",
    description: "Your administrator role does not include permission to open this section.",
    viewStorefront: "View storefront",
    signOut: "Sign out"
  }
};

export type AdminDictionary = typeof adminEn;

export const adminAr: AdminDictionary = {
  brand: {
    name: "وهج",
    subtitle: "إدارة المرسم",
    tooltip: "لوحة تحكم وهج",
    fallbackAdmin: "إدارة وهج",
    fallbackRole: "مرسم وهج"
  },
  nav: {
    groups: {
      atelier: "المرسم",
      catalog: "الكتالوج",
      storefront: "المتجر"
    },
    overview: "نظرة عامة",
    orders: "الطلبات",
    products: "المنتجات",
    newProduct: "منتج جديد",
    newShort: "جديد",
    editProduct: "تعديل المنتج",
    orderDetails: "تفاصيل الطلب",
    categories: "الفئات",
    colors: "الألوان",
    sizes: "الأحجام",
    addons: "الإضافات",
    coupons: "كوبونات الخصم",
    reviews: "التقييمات",
    settings: "الإعدادات",
    viewStorefront: "عرض المتجر",
    signOut: "تسجيل الخروج",
    dashboard: "لوحة التحكم",
    toggleSidebar: "تبديل القائمة الجانبية",
    toggleSidebarShortcut: "تبديل القائمة الجانبية (Ctrl+B)",
    mobileSidebarTitle: "القائمة",
    mobileSidebarDescription: "التنقل في لوحة التحكم"
  },
  common: {
    active: "نشط",
    inactive: "غير نشط",
    hidden: "مخفي",
    archived: "مؤرشف",
    approved: "معتمد",
    pending: "قيد المراجعة",
    save: "حفظ",
    saving: "جاري الحفظ...",
    saveChanges: "حفظ التغييرات",
    delete: "حذف",
    deleting: "جاري الحذف...",
    confirmDelete: "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.",
    filter: "تصفية",
    all: "الكل",
    egp: "ج.م",
    sortOrder: "ترتيب العرض",
    imageUrl: "رابط الصورة",
    nameArPrimary: "الاسم (العربية · أساسي)",
    nameEnSecondary: "الاسم (English · ثانوي)",
    descriptionArPrimary: "الوصف (العربية · أساسي)",
    descriptionEnSecondary: "الوصف (English · ثانوي)",
    upload: "رفع صورة",
    uploading: "جاري الرفع...",
    uploadSuccess: "تم رفع الصورة. احفظ النموذج لتطبيق التغيير.",
    uploadFailed: "فشل رفع الصورة. حاول مرة أخرى.",
    previewFailed: "تعذر معاينة رابط الصورة.",
    networkError: "خطأ في الاتصال — حاول مرة أخرى."
  },
  overview: {
    kicker: "ملخص المرسم",
    title: "نظرة عامة",
    subtitle: "متابعة الإيرادات والطلبات وحالة المخزون ونشاط المتجر.",
    presets: {
      last7: "7 أيام",
      last30: "30 يوم",
      last90: "90 يوم"
    },
    metrics: {
      totalOrders: "إجمالي الطلبات",
      pendingOrders: "طلبات بانتظار التأكيد",
      preparingOrders: "طلبات قيد التجهيز",
      shippedOrders: "طلبات تم شحنها",
      deliveredOrders: "طلبات تم توصيلها",
      totalProducts: "إجمالي المنتجات",
      activeProducts: "المنتجات النشطة",
      customers: "العملاء",
      revenue: "الإيرادات"
    },
    cards: {
      revenueTitle: "إجمالي الإيرادات",
      rangeRevenue: "خلال الفترة المحددة",
      pipelineTitle: "حركة الطلبات",
      inProgressLabel: "قيد المتابعة",
      deliveredLabel: "تم توصيلها",
      catalogTitle: "الكتالوج والمخزون",
      activeUnit: "نشط",
      archivedUnit: "مؤرشف",
      stockUnitsLabel: "قطعة متاحة",
      lowStockLabel: "مخزون منخفض",
      pulseTitle: "نبض المتجر",
      customersUnit: "عميل",
      couponsUnit: "كوبون نشط",
      reviewsUnit: "تقييم للمراجعة"
    },
    charts: {
      metricRevenue: "الإيرادات",
      metricOrders: "الطلبات",
      peakDay: "أعلى يوم",
      emptyTrendNote:
        "لا توجد طلبات مسجلة في هذه الفترة حتى الآن — سيظهر منحنى المبيعات وعدد الطلبات تلقائياً مع أول طلب.",
      statusChartSubtitle: "توزيع حالات الطلبات خلال الفترة المختارة",
      totalLabel: "الإجمالي",
      openOrdersLink: "عرض الطلبات",
      openProductsLink: "إدارة الكتالوج",
      catalogMixTitle: "تحليلات الكتالوج والمخزون",
      catalogMixSubtitle: "توزيع الفئات (النشط مقابل المؤرشف) ومستويات مخزون المنتجات المعروضة حالياً.",
      byCategoryHeading: "المنتجات حسب الفئة",
      activeStockHeading: "مخزون المنتجات النشطة",
      units: "قطعة",
      avgPrice: "متوسط سعر النشط",
      emptyCategoryProducts: "بدون منتجات",
      configuredColorsHint: "{count} ألوان متاحة للتخصيص",
      configuredAddonsHint: "{count} إضافات تجهيز متاحة",
      activeCatalogHint: "{count} منتجات نشطة معروضة بالمتجر"
    },
    salesInRange: "منحنى المبيعات والطلبات",
    ordersUnit: "طلب",
    aovLabel: "متوسط الطلب",
    ordersByStatus: "الطلبات حسب الحالة",
    noOrdersInRange: "لا توجد طلبات مسجلة في هذه الفترة.",
    bestSellers: "الأكثر مبيعًا",
    topColors: "الألوان الأكثر طلبًا",
    topAddons: "الإضافات الأكثر طلبًا",
    noSalesInRange: "لا توجد مبيعات في هذه الفترة."
  },
  orders: {
    kicker: "تنفيذ الطلبات",
    title: "الطلبات",
    searchPlaceholder: "رقم الطلب، اسم العميل، الهاتف",
    allStatuses: "جميع الحالات",
    empty: "لم يتم العثور على طلبات.",
    autoRefreshPrefix: "التحديث التلقائي مفعل ·",
    autoRefreshChecked: "آخر فحص",
    autoRefreshWatching: "في انتظار طلبات جديدة",
    insights: {
      totalOrders: "إجمالي الطلبات",
      activeQueue: "قيد التنفيذ",
      totalValue: "إجمالي القيمة",
      aov: "متوسط الطلب",
      pipelineTitle: "توزيع حالات الطلبات",
      last14Days: "حركة آخر 14 يوم",
      noRecentOrders: "لا توجد طلبات مسجلة خلال آخر 14 يوم."
    },
    columns: {
      order: "الطلب",
      customer: "العميل",
      phone: "الهاتف",
      total: "الإجمالي",
      status: "الحالة",
      date: "التاريخ"
    }
  },
  orderDetail: {
    kicker: "ملف الطلب",
    deleteOrder: "حذف الطلب",
    payment: "الدفع",
    instapayPrepaid: "انستاباي (مدفوع مسبقًا)",
    cashOnDelivery: "الدفع عند الاستلام",
    receiptAlt: "إيصال الدفع",
    noReceipt: "لم يتم رفع إيصال",
    itemsAndCustomization: "القطع والتخصيص",
    qty: "الكمية",
    size: "الحجم",
    base: "الأساسي",
    color: "اللون",
    setQty: "تعديل الكمية",
    zeroRemovesItem: "القيمة 0 تزيل العنصر",
    statusHistory: "سجل الحالات",
    editCustomerDetails: "تعديل بيانات العميل",
    customerName: "اسم العميل",
    phone: "رقم الهاتف",
    whatsapp: "واتساب",
    email: "البريد الإلكتروني",
    governorate: "المحافظة",
    city: "المدينة / المنطقة",
    fullAddress: "العنوان بالتفصيل",
    building: "المبنى / الشقة",
    customerNotes: "ملاحظات العميل",
    internalNotes: "ملاحظات داخلية",
    customer: "بيانات العميل",
    address: "العنوان",
    notProvided: "غير مضاف",
    notes: "الملاحظات",
    noNotes: "لا توجد ملاحظات",
    totals: "الإجماليات",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    shipping: "الشحن",
    total: "الإجمالي",
    updateStatus: "تحديث الحالة",
    status: "الحالة",
    internalNote: "ملاحظة داخلية"
  },
  products: {
    kicker: "مخزون المرسم",
    title: "المنتجات",
    subtitle: "إدارة المنتجات، صور الألوان، الإضافات، الأسعار، المخزون، والأرشفة.",
    newProduct: "منتج جديد",
    filterAriaLabel: "تصفية حالة المنتجات",
    tabs: {
      all: "الكل",
      active: "النشطة",
      archived: "المؤرشفة"
    },
    empty: {
      archivedTitle: "لا توجد منتجات مؤرشفة",
      activeTitle: "لا توجد منتجات نشطة",
      allTitle: "لا توجد منتجات بعد",
      archivedHint: "ستظهر المنتجات المؤرشفة هنا وتبقى مخفية عن العملاء حتى استعادتها.",
      defaultHint: "استخدم التصفية أعلاه أو أنشئ منتجًا جديدًا لعرضه في المتجر."
    },
    fields: {
      category: "الفئة",
      price: "السعر",
      stock: "المخزون",
      options: "الخيارات",
      product: "المنتج",
      status: "الحالة",
      actions: "الإجراءات",
      colorsWord: "ألوان",
      addonsWord: "إضافات"
    },
    deleteConfirmPrefix: "حذف",
    deleteConfirmSuffix: "سيتم إزالته من المتجر نهائيًا.",
    deleteError: "تعذر حذف المنتج.",
    archive: "أرشفة",
    archiving: "جاري الأرشفة...",
    restore: "استعادة",
    restoring: "جاري الاستعادة...",
    archiveAriaPrefix: "أرشفة",
    restoreAriaPrefix: "استعادة",
    statusUpdateError: "تعذر تحديث حالة المنتج.",
    insights: {
      catalogRatio: "المنتجات النشطة من الكل",
      unitsInStock: "إجمالي القطع بالمخزون",
      inventoryValue: "قيمة المخزون النشط",
      lowStock: "مخزون منخفض (≤ 5)",
      stockByProduct: "مخزون وأسعار المنتجات النشطة",
      categorySplit: "توزيع المنتجات حسب الفئة"
    },
    newPage: {
      kicker: "إضافة للمرسم",
      title: "منتج جديد",
      subtitle: "أنشئ منتجًا جديدًا بجميع تفاصيله بسهولة."
    },
    editPage: {
      kicker: "تعديل المنتج",
      title: "تعديل المنتج"
    },
    form: {
      readiness: {
        title: "جاهزية نشر المنتج",
        completeLabel: "{done}/{total} مكتمل",
        priceSpread: "نطاق سعر العميل",
        checks: {
          arName: "الاسم بالعربية",
          enName: "الاسم بالإنجليزية",
          category: "الفئة",
          pricingStock: "السعر والمخزون",
          photo: "الصورة الرئيسية",
          seo: "SEO ثنائي اللغة",
          options: "ألوان / أحجام / إضافات"
        }
      },
      steps: {
        basic: "الأساسيات",
        images: "الصور",
        colors: "الألوان",
        sizes: "الأحجام",
        addons: "الإضافات",
        seo: "SEO",
        preview: "معاينة"
      },
      slug: "الرابط المختصر (Slug)",
      slugHint: "يُنشأ تلقائيًا. اتركه كما هو وسيتم توليده من الاسم أو الكود عند الحفظ.",
      sku: "رمز المنتج (SKU)",
      skuHint: "يُنشأ تلقائيًا من اسم المنتج. لا حاجة لملئه — يتم توليد كود فريد عند الحفظ.",
      category: "الفئة",
      chooseCategory: "اختر الفئة",
      basePrice: "السعر الأساسي",
      stockQuantity: "الكمية بالمخزون",
      flags: {
        active: "نشط (ظاهر في المتجر)",
        featured: "مميز",
        bestSeller: "الأكثر مبيعًا"
      },
      mainPhoto: "الصورة الرئيسية للمنتج",
      mainPhotoHint: "تظهر هذه الصورة في بطاقات المنتجات وعند مشاركة رابط المنتج.",
      gallery: "معرض الصور",
      addImage: "إضافة صورة",
      altArPrimary: "النص البديل (العربية · أساسي)",
      altEnSecondary: "النص البديل (English · ثانوي)",
      mainPhotoBadge: "الصورة الرئيسية",
      useAsMainPhoto: "تعيين كصورة رئيسية",
      remove: "إزالة",
      noColorsSelected: "لم يتم تحديد ألوان — هذا مقبول، ويمكنك حفظ ونشر المنتج بدون ألوان.",
      colorsSelectedCount: "تم تحديد {count} لون. يمكن للعملاء تخطي اختيار اللون إذا لم يكن مطلوبًا.",
      additionalPrice: "سعر إضافي",
      variantImage: "صورة اللون",
      noSizesSelected: "لم يتم تحديد أحجام — يمكن للعملاء طلب المنتج مباشرة. اختر حجمًا لإلزامهم بالاختيار.",
      sizesSelectedCount: "تم تحديد {count} حجم. يجب على العميل اختيار حجم واحد، ولكل حجم سعره الكامل.",
      noSizesExist: "لا توجد أحجام بعد. أضف الأحجام من قسم الأحجام أولاً.",
      fullPriceForProduct: "السعر الكامل لهذا الحجم",
      seoTitleAr: "عنوان SEO (العربية · أساسي)",
      seoTitleEn: "عنوان SEO (English · ثانوي)",
      metaDescriptionAr: "وصف Meta (العربية · أساسي)",
      metaDescriptionEn: "وصف Meta (English · ثانوي)",
      canonicalUrl: "الرابط الأساسي (Canonical URL)",
      untitledProduct: "منتج بدون اسم",
      previewSummary:
        "سيتم نشر {name} مع {colors} خيار لون، و{sizes} حجم، و{addons} إضافة، ومخزون {stock}، وسعر أساسي {price} ج.م.",
      saveError: "تعذر حفظ المنتج.",
      previous: "السابق",
      next: "التالي",
      saveProduct: "حفظ المنتج"
    }
  },
  categories: {
    kicker: "تنظيم المرسم",
    title: "الفئات",
    createSubmit: "إنشاء فئة",
    nameArPlaceholder: "مثال: شموع الصويا",
    nameEnPlaceholder: "e.g. Candles",
    slug: "الرابط المختصر (Slug)",
    currentTitle: "الفئات الحالية",
    insights: {
      totalCategories: "إجمالي الفئات",
      activeCategories: "فئات نشطة",
      assignedProducts: "إجمالي المنتجات",
      breakdownTitle: "توزيع المنتجات حسب الفئة",
      activeLabel: "نشط",
      archivedLabel: "مؤرشف",
      emptyWord: "فارغة"
    }
  },
  colors: {
    kicker: "لوحة الألوان",
    title: "الألوان",
    createSubmit: "إنشاء لون",
    nameArPlaceholder: "مثال: أبيض دافئ",
    nameEnPlaceholder: "e.g. Warm White",
    hexCode: "كود اللون (Hex)",
    currentTitle: "الألوان الحالية",
    insights: {
      totalColors: "إجمالي الألوان",
      activeColors: "ألوان نشطة",
      linkedVariants: "ربط بالمنتجات",
      usageTitle: "توزيع استخدام الألوان بالمنتجات",
      productsWord: "منتجات"
    }
  },
  sizes: {
    kicker: "أحجام الأوعية",
    title: "الأحجام",
    subtitle:
      "أحجام مشتركة للمنتجات (مثل 50 جم، 100 جم، 150 جم). يمكن لكل منتج اختيار مجموعة منها وتحديد السعر الكامل لكل حجم.",
    createSubmit: "إنشاء حجم",
    nameArPlaceholder: "مثال: ١٠٠ جم",
    nameEnPlaceholder: "e.g. 100g",
    currentTitle: "الأحجام الحالية",
    empty: "لا توجد أحجام بعد. أضف حجمًا هنا ثم اربطه بأي منتج.",
    insights: {
      totalSizes: "إجمالي الأحجام",
      activeSizes: "أحجام نشطة",
      linkedVariants: "تغييرات المنتجات",
      adoptionTitle: "استخدام الأحجام في المنتجات",
      variantsWord: "منتجات"
    }
  },
  addons: {
    kicker: "لمسات المرسم",
    title: "الإضافات",
    createSubmit: "إنشاء إضافة",
    nameArPlaceholder: "مثال: ورق ذهب",
    nameEnPlaceholder: "e.g. Gold Leaf",
    price: "السعر",
    currentTitle: "الإضافات الحالية",
    insights: {
      totalAddons: "إجمالي الإضافات",
      activeAddons: "إضافات نشطة",
      priceRange: "نطاق الأسعار",
      attachedProducts: "ربط بالمنتجات",
      comparisonTitle: "مقارنة أسعار واستخدام الإضافات",
      productsWord: "منتجات"
    }
  },
  coupons: {
    kicker: "عروض المرسم",
    title: "كوبونات الخصم",
    subtitle: "خصومات بنسبة مئوية أو مبلغ ثابت يتم التحقق منها على الخادم عند الدفع، ويُحتسب الاستخدام عند إنشاء الطلب.",
    createSubmit: "إنشاء كوبون",
    code: "الكود",
    codePlaceholder: "WELCOME10",
    type: "النوع",
    percentOption: "نسبة مئوية %",
    fixedOption: "مبلغ ثابت ج.م",
    value: "القيمة",
    minSubtotal: "الحد الأدنى للطلب",
    maxUses: "أقصى عدد استخدام (فارغ = غير محدود)",
    startsAt: "يبدأ في",
    endsAt: "ينتهي في",
    currentTitle: "الكوبونات الحالية",
    minPrefix: "الحد الأدنى",
    usedPrefix: "استُخدم",
    insights: {
      activeCoupons: "كوبونات نشطة",
      totalRedemptions: "مرات الاستخدام",
      totalCapacity: "السعة المحددة",
      utilizationTitle: "معدل استهلاك سعة الكوبونات",
      unlimitedLabel: "غير محدود",
      expiredLabel: "منتهي",
      scheduledLabel: "مجدول"
    }
  },
  reviews: {
    kicker: "آراء العملاء",
    title: "التقييمات",
    subtitle: "تحتاج تقييمات العملاء إلى الموافقة قبل ظهورها في صفحات المنتجات.",
    empty: "لا توجد تقييمات بعد.",
    approve: "اعتماد",
    insights: {
      totalReviews: "إجمالي التقييمات",
      avgRating: "متوسط التقييم",
      pendingModeration: "بانتظار الاعتماد",
      approvedCount: "منشور بالمتجر",
      distributionTitle: "توزيع التقييمات (1–5 نجوم)",
      tabs: {
        all: "الكل",
        pending: "بانتظار الاعتماد",
        approved: "معتمد"
      }
    }
  },
  settings: {
    kicker: "إعدادات المرسم",
    title: "إعدادات المتجر",
    subtitle: "يتم حفظ بيانات المظهر والشحن والتواصل ووسائل الدفع في قاعدة البيانات.",
    saveSubmit: "حفظ الإعدادات",
    flatShippingRate: "سعر الشحن الافتراضي (الاحتياطي)",
    freeShippingThreshold: "حد الشحن المجاني (0 = معطل)",
    whatsappNumber: "رقم الواتساب",
    primaryColor: "اللون الأساسي",
    secondaryColor: "اللون الثانوي",
    heroImage: "صورة الواجهة الرئيسية",
    contactEmail: "بريد التواصل",
    instapayHandle: "عنوان انستاباي (مثال: name@instapay)",
    instapayLink: "رابط الدفع عبر انستاباي",
    instapayQrImage: "صورة QR لانستاباي",
    instapayQrPreviewAlt: "معاينة رمز QR لانستاباي",
    telegramChatId: "معرّف محادثة تيليجرام لتنبيهات الطلبات (التوكن في TELEGRAM_BOT_TOKEN)",
    shippingByGovernorate: "أسعار الشحن حسب المحافظة",
    shippingByGovernorateHint:
      "تستخدم الطلبات السعر المحدد للمحافظة، وإلا السعر الافتراضي. ويُطبق حد الشحن المجاني أولاً.",
    saveRate: "حفظ السعر",
    rate: "السعر",
    insights: {
      activeGovernorates: "المحافظات المفعلة",
      avgRate: "متوسط الشحن",
      rateSpread: "أقل – أعلى سعر",
      freeThreshold: "شحن مجاني عند",
      disabledLabel: "معطل",
      shippingChartTitle: "مقارنة أسعار الشحن بين المحافظات",
      channelHealthTitle: "جاهزية قنوات المتجر",
      instapayLabel: "انستاباي",
      qrLabel: "رمز QR",
      telegramLabel: "تنبيهات تيليجرام",
      brandPaletteLabel: "ألوان الهوية",
      readyLabel: "مضبوط",
      missingLabel: "غير مضبوط"
    }
  },
  forbidden: {
    title: "صلاحية غير كافية",
    description: "دور المسؤول الحالي لا يملك صلاحية الوصول إلى هذا القسم.",
    viewStorefront: "عرض المتجر",
    signOut: "تسجيل الخروج"
  }
};

export const adminDictionaries: Record<Locale, AdminDictionary> = {
  ar: adminAr,
  en: adminEn
};

export function interpolate(
  template: string,
  values: Record<string, string | number>
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`
  );
}

export function getAdminRoleLabel(roleName: string, locale: Locale): string {
  if (locale === "ar" && roleName === "Super Admin") {
    return "مدير عام";
  }
  return roleName;
}
