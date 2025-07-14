import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICoordinates {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export interface IAddress {
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}

export interface IAreaOfInterest {
    name: string;
    coordinates: ICoordinates;
    radius: number; // in meters
}

export interface ILocation {
    current?: ICoordinates;
    address?: IAddress;
    searchRadius: number;
    areasOfInterest: IAreaOfInterest[];
    hasLocationPermission: boolean;
}

export interface ICategoryPreference {
    enabled: boolean;
    weight: number; // 0-100
    subcategories: Record<string, boolean>;
}

export interface IPreferences {
    categories: {
        food: ICategoryPreference;
        shopping: ICategoryPreference;
        services: ICategoryPreference;
        entertainment: ICategoryPreference;
        professional: ICategoryPreference;
    };
    priceRange: {
        min: number;
        max: number;
    };
    dietary: {
      vegetarian: boolean;
        vegan: boolean;
        glutenFree: boolean;
        other: string[]; // array of dietary restrictions
    };
    accessibility: {
        wheelchairAccessible: boolean;
        hearingImpaired: boolean;
        visuallyImpaired: boolean;
        other: string[]; // array of accessibility features
    };
    experienceLevel: 'TOURIST' | 'NEW_RESIDENT' | 'LOCAL' | 'LONG_TERM_RESIDENT';
    discoveryStyle: 'ADVENTUROUS' | 'MODERATE' | 'CONSERVATIVE';
}

export interface IProfile {
    email: string;
    displayName?: string;
    photoUrl?: string;
    preferredLanguage?: 'es' | 'en' | 'pt';
    country?: 'AR' | 'BO' | 'BR' | 'CL' | 'CO' | 'EC' | 'PE' | 'UY' | 'VE' | 'PY';
}

export interface IOnBoarding {
    isCompleted: boolean;
    currentStep: number;
    stepsCompleted: {
        welcome: boolean;
        location: boolean;
        categories: boolean;
        preferences: boolean;
        experience: boolean;
        review: boolean;
    };
    skippedSteps: Array<{
        step: string;
        timestamp: Date;
    }>;
    startedAt: Date;
    completedAt?: Date;
    timeSpentMinutes?: number; // total time spent in onboarding
}

export interface IUser extends Document {
    firebaseUid: string; // Firebase UID
    profile: IProfile;
    location: ILocation;
    preferences: IPreferences;
    onboarding: IOnBoarding;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date;
    version: number;
}

const coordinatesSchema = new Schema<ICoordinates>({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number],
        required: false,
        validate: {
            validator: function(coords: number[]) {
                if (!coords || coords.length !== 2) return false;
                const [lng, lat] = coords;
                return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
            },
            message: 'Invalid coordinates format [longitude, latitude]'
        }
    }
}, { _id: false });

const addressSchema = new Schema<IAddress>({
    street: { type: String, trim: true, maxlength: 200 },
    neighborhood: { type: String, trim: true, maxlength: 100 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    country: { type: String, trim: true, maxlength: 50 },
    postalCode: { type: String, trim: true, maxlength: 20 }
}, { _id: false });

const areaOfInterestSchema = new Schema<IAreaOfInterest>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    coordinates: {
        type: coordinatesSchema,
        required: true
    },
    radius: {
        type: Number,
        min: 100,
        max: 10000,
        default: 1000
    }
}, { _id: false });

const categoryPreferenceSchema = new Schema<ICategoryPreference>({
    enabled: { type: Boolean, default: true },
    weight: { type: Number, min: 0, max: 10, default: 5 },
    subcategories: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, { _id: false });

// Default subcategories
const defaultSubcategories = {
    food: {
        restaurants: true,
        cafes: true,
        bars: true,
        foodTrucks: true,
        bakeries: true,
        fastFood: true
    },
    shopping: {
        retail: true,
        boutiques: true,
        markets: true,
        supermarkets: true,
        bookstores: true
    },
    services: {
        beauty: true,
        fitness: true,
        healthcare: true,
        automotive: true,
        repair: true
    },
    entertainment: {
        museums: true,
        theaters: true,
        nightlife: true,
        parks: true,
        sports: true
    },
    professional: {
        coworking: true,
        business: true,
        financial: true,
        legal: true
    }
};


const userSchema = new Schema<IUser>({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 10,
        maxlength: 50,
        index: true
    },

    profile: {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            index: true
        },
        displayName: {
            type: String,
            required: false,
            trim: true,
            minlength: 1,
            maxlength: 100
        },
        photoUrl: {
            type: String,
            required: false,
            match: /^https?:\/\/.+/
        },
        preferredLanguage: {
            type: String,
            enum: ['es', 'pt', 'en'],
            default: 'es',
            required: true
        },
        country: {
            type: String,
            enum: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'PE', 'UY', 'VE', 'PY'],
            required: false
        }
    },

    location: {
        current: {
            type: coordinatesSchema,
            required: false
        },
        address: {
            type: addressSchema,
            required: false
        },
        searchRadius: {
            type: Number,
            min: 500,        // 500 meters minimum
            max: 50000,      // 50km maximum
            default: 2000,   // 2km default
            required: true
        },
        areasOfInterest: [areaOfInterestSchema],
        hasLocationPermission: {
            type: Boolean,
            default: false
        }
    },

    preferences: {
        categories: {
            food: {
                type: categoryPreferenceSchema,
                default: () => ({
                    enabled: true,
                    weight: 5,
                    subcategories: defaultSubcategories.food
                })
            },
            shopping: {
                type: categoryPreferenceSchema,
                default: () => ({
                    enabled: true,
                    weight: 5,
                    subcategories: defaultSubcategories.shopping
                })
            },
            services: {
                type: categoryPreferenceSchema,
                default: () => ({
                    enabled: true,
                    weight: 5,
                    subcategories: defaultSubcategories.services
                })
            },
            entertainment: {
                type: categoryPreferenceSchema,
                default: () => ({
                    enabled: true,
                    weight: 5,
                    subcategories: defaultSubcategories.entertainment
                })
            },
            professional: {
                type: categoryPreferenceSchema,
                default: () => ({
                    enabled: false,
                    weight: 5,
                    subcategories: defaultSubcategories.professional
                })
            }
        },

        priceRange: {
            min: { type: Number, min: 1, max: 4, default: 1 },
            max: { type: Number, min: 1, max: 4, default: 3 }
        },

        dietary: {
            vegetarian: { type: Boolean, default: false },
            vegan: { type: Boolean, default: false },
            glutenFree: { type: Boolean, default: false },
            halal: { type: Boolean, default: false },
            kosher: { type: Boolean, default: false },
            keto: { type: Boolean, default: false },
            other: [{ type: String, trim: true, maxlength: 50 }]
        },

        accessibility: {
            wheelchairAccessible: { type: Boolean, default: false },
            hearingImpaired: { type: Boolean, default: false },
            visuallyImpaired: { type: Boolean, default: false },
            other: [{ type: String, trim: true, maxlength: 100 }]
        },

        experienceLevel: {
            type: String,
            enum: ['TOURIST', 'NEW_RESIDENT', 'LOCAL', 'LONG_TERM_RESIDENT'],
            default: 'LOCAL'
        },

        discoveryStyle: {
            type: String,
            enum: ['ADVENTUROUS', 'MODERATE', 'CONSERVATIVE'],
            default: 'MODERATE'
        }
    },

    onboarding: {
        isCompleted: { type: Boolean, default: false, required: true },
        currentStep: { type: Number, min: 0, max: 5, default: 0 },
        stepsCompleted: {
            welcome: { type: Boolean, default: false },
            location: { type: Boolean, default: false },
            categories: { type: Boolean, default: false },
            preferences: { type: Boolean, default: false },
            experience: { type: Boolean, default: false },
            review: { type: Boolean, default: false }
        },
        skippedSteps: [{
            step: String,
            timestamp: { type: Date, default: Date.now }
        }],
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date, required: false },
        timeSpentMinutes: { type: Number, min: 0, default: 0 }
    },

    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1, min: 1 }
});



userSchema.index({ firebaseUid: 1 });
userSchema.index({ 'profile.email': 1 });
userSchema.index({ 'location.current': '2dsphere' });
userSchema.index({ 'onboarding.isCompleted': 1, createdAt: -1 });
userSchema.index({ 'profile.country': 1, 'location.current': '2dsphere' });

userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

userSchema.pre('save', function(next) {
    if (this.preferences.priceRange.min > this.preferences.priceRange.max) {
        next(new Error('Price range minimum cannot exceed maximum'));
        return;
    }
    next();
});

userSchema.methods.updateLastActive = function() {
    this.lastActiveAt = new Date();
    return this.save();
};

userSchema.methods.completeOnboardingStep = function(step: string) {
    if (this.onboarding.stepsCompleted.hasOwnProperty(step)) {
        (this.onboarding.stepsCompleted as any)[step] = true;

        // Check if all steps are completed
        const allSteps = Object.values(this.onboarding.stepsCompleted);
        if (allSteps.every(completed => completed)) {
            this.onboarding.isCompleted = true;
            this.onboarding.completedAt = new Date();
        }
    }
    return this.save();
};

userSchema.statics.findByFirebaseUid = function(firebaseUid: string) {
    return this.findOne({ firebaseUid });
};

userSchema.statics.findNearLocation = function(longitude: number, latitude: number, maxDistance: number = 10000) {
    return this.find({
        'location.current': {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        }
    });
};



export const User = mongoose.model<IUser>('User', userSchema);
