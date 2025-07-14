import express, { Router, Response } from 'express';
import { User, IUser } from '../models/User';

import { AuthenticatedRequest } from '../types';
import {authenticateToken} from "../middleware/auth";





const router: Router = express.Router();


router.get('/test-no-auth', async (req: AuthenticatedRequest, res: Response) => {
    console.log('📝 Test route hit - no auth required');
    res.json({
        message: 'Onboarding routes are working!',
        timestamp: new Date().toISOString()
    });
});


router.use(authenticateToken);

// GET /api/onboarding/status - Check current onboarding progress
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            onboarding: user.onboarding,
            profile: {
                email: user.profile.email,
                displayName: user.profile.displayName,
                country: user.profile.country
            }
        });
    } catch (error) {
        console.error('Get onboarding status error:', error);
        res.status(500).json({ error: 'Failed to get onboarding status' });
    }
});

// POST /api/onboarding/start - Initialize onboarding for new user
router.post('/start', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { displayName, country } = req.body;

        let user = await User.findOne({ firebaseUid: req.user!.firebaseUid });
        if (user) {
            return res.status(409).json({
                error: 'User already exists',
                onboarding: user.onboarding
            });
        }

        // Create new user
        user = new User({
            firebaseUid: req.user!.firebaseUid,
            profile: {
                email: req.user!.email,
                displayName: displayName?.trim() || '',
                preferredLanguage: 'es', // Default, can be changed later
                country: country
            }
        });

        await user.save();

        res.status(201).json({
            message: 'Onboarding started successfully',
            user: {
                firebaseUid: user.firebaseUid,
                profile: user.profile,
                onboarding: user.onboarding
            }
        });

    } catch (error) {
        console.error('Start onboarding error:', error);
        res.status(500).json({ error: 'Failed to start onboarding' });
    }
});

// PUT /api/onboarding/step/:stepName - Mark a step as completed
router.put('/step/:stepName', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { stepName } = req.params;
        const validSteps = ['welcome', 'location', 'categories', 'preferences', 'experience', 'review'];

        if (!validSteps.includes(stepName)) {
            return res.status(400).json({
                error: 'Invalid step name',
                validSteps
            });
        }

        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Mark step as completed
        (user.onboarding.stepsCompleted as any)[stepName] = true;

        // Update current step to next step
        const stepIndex = validSteps.indexOf(stepName);
        user.onboarding.currentStep = Math.max(user.onboarding.currentStep, stepIndex + 1);

        await user.save();

        res.json({
            message: `Step ${stepName} completed`,
            onboarding: user.onboarding
        });
    } catch (error) {
        console.error('Complete step error:', error);
        res.status(500).json({ error: 'Failed to complete step' });
    }
});

// PUT /api/onboarding/location - Save location preferences
router.put('/location', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            coordinates, // [longitude, latitude]
            address,
            searchRadius,
            areasOfInterest,
            hasLocationPermission
        } = req.body;

        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate coordinates if provided
        if (coordinates) {
            if (!Array.isArray(coordinates) || coordinates.length !== 2) {
                return res.status(400).json({
                    error: 'Coordinates must be an array of [longitude, latitude]'
                });
            }
            const [lng, lat] = coordinates;
            if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                return res.status(400).json({
                    error: 'Invalid coordinates range'
                });
            }
        }

        // Validate search radius
        if (searchRadius && (searchRadius < 500 || searchRadius > 50000)) {
            return res.status(400).json({
                error: 'Search radius must be between 500m and 50km'
            });
        }

        // Update location data
        if (coordinates) {
            user.location.current = {
                type: 'Point',
                coordinates: [coordinates[0], coordinates[1]]
            };
        }

        if (address) {
            user.location.address = address;
        }

        if (searchRadius) {
            user.location.searchRadius = searchRadius;
        }

        if (areasOfInterest) {
            user.location.areasOfInterest = areasOfInterest;
        }

        if (typeof hasLocationPermission === 'boolean') {
            user.location.hasLocationPermission = hasLocationPermission;
        }

        // Mark location step as completed
        user.onboarding.stepsCompleted.location = true;
        user.onboarding.currentStep = Math.max(user.onboarding.currentStep, 2);

        await user.save();

        res.json({
            message: 'Location preferences saved',
            location: user.location
        });
    } catch (error) {
        console.error('Save location error:', error);
        res.status(500).json({ error: 'Failed to save location preferences' });
    }
});

// PUT /api/onboarding/categories - Save category preferences
router.put('/categories', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { categories } = req.body;

        if (!categories || typeof categories !== 'object') {
            return res.status(400).json({
                error: 'Categories object is required'
            });
        }

        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validCategories = ['food', 'shopping', 'services', 'entertainment', 'professional'];

        // Update each provided category
        for (const [categoryName, categoryData] of Object.entries(categories)) {
            if (!validCategories.includes(categoryName)) {
                return res.status(400).json({
                    error: `Invalid category: ${categoryName}`,
                    validCategories
                });
            }

            const data = categoryData as any;

            // Validate weight if provided
            if (data.weight !== undefined && (data.weight < 0 || data.weight > 10)) {
                return res.status(400).json({
                    error: `Weight for ${categoryName} must be between 0 and 10`
                });
            }

            // Update category preferences
            if (data.enabled !== undefined) {
                user.preferences.categories[categoryName as keyof typeof user.preferences.categories].enabled = data.enabled;
            }
            if (data.weight !== undefined) {
                user.preferences.categories[categoryName as keyof typeof user.preferences.categories].weight = data.weight;
            }
            if (data.subcategories) {
                user.preferences.categories[categoryName as keyof typeof user.preferences.categories].subcategories = {
                    ...user.preferences.categories[categoryName as keyof typeof user.preferences.categories].subcategories,
                    ...data.subcategories
                };
            }
        }

        // Mark categories step as completed
        user.onboarding.stepsCompleted.categories = true;
        user.onboarding.currentStep = Math.max(user.onboarding.currentStep, 3);

        await user.save();

        res.json({
            message: 'Category preferences saved',
            categories: user.preferences.categories
        });
    } catch (error) {
        console.error('Save categories error:', error);
        res.status(500).json({ error: 'Failed to save category preferences' });
    }
});

// PUT /api/onboarding/preferences - Save personal preferences
router.put('/preferences', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { priceRange, dietary, accessibility } = req.body;

        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate and update price range
        if (priceRange) {
            if (priceRange.min < 1 || priceRange.min > 4 || priceRange.max < 1 || priceRange.max > 4) {
                return res.status(400).json({
                    error: 'Price range values must be between 1 and 4'
                });
            }
            if (priceRange.min > priceRange.max) {
                return res.status(400).json({
                    error: 'Price range minimum cannot exceed maximum'
                });
            }
            user.preferences.priceRange = priceRange;
        }

        // Update dietary preferences
        if (dietary) {
            user.preferences.dietary = {
                ...user.preferences.dietary,
                ...dietary
            };
        }

        // Update accessibility preferences
        if (accessibility) {
            user.preferences.accessibility = {
                ...user.preferences.accessibility,
                ...accessibility
            };
        }

        // Mark preferences step as completed
        user.onboarding.stepsCompleted.preferences = true;
        user.onboarding.currentStep = Math.max(user.onboarding.currentStep, 4);

        await user.save();

        res.json({
            message: 'Personal preferences saved',
            preferences: {
                priceRange: user.preferences.priceRange,
                dietary: user.preferences.dietary,
                accessibility: user.preferences.accessibility
            }
        });
    } catch (error) {
        console.error('Save preferences error:', error);
        res.status(500).json({ error: 'Failed to save personal preferences' });
    }
});

// PUT /api/onboarding/experience - Save experience level and discovery style
router.put('/experience', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { experienceLevel, discoveryStyle, preferredLanguage } = req.body;

        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate experience level
        if (experienceLevel) {
            const validLevels = ['TOURIST', 'NEW_RESIDENT', 'LOCAL', 'LONG_TERM_RESIDENT'];
            if (!validLevels.includes(experienceLevel)) {
                return res.status(400).json({
                    error: 'Invalid experience level',
                    validLevels
                });
            }
            user.preferences.experienceLevel = experienceLevel;
        }

        // Validate discovery style
        if (discoveryStyle) {
            const validStyles = ['ADVENTUROUS', 'MODERATE', 'CONSERVATIVE'];
            if (!validStyles.includes(discoveryStyle)) {
                return res.status(400).json({
                    error: 'Invalid discovery style',
                    validStyles
                });
            }
            user.preferences.discoveryStyle = discoveryStyle;
        }

        // Update preferred language if provided
        if (preferredLanguage) {
            const validLanguages = ['es', 'pt', 'en'];
            if (!validLanguages.includes(preferredLanguage)) {
                return res.status(400).json({
                    error: 'Invalid language',
                    validLanguages
                });
            }
            user.profile.preferredLanguage = preferredLanguage;
        }

        // Mark experience step as completed
        user.onboarding.stepsCompleted.experience = true;
        user.onboarding.currentStep = Math.max(user.onboarding.currentStep, 5);

        await user.save();

        res.json({
            message: 'Experience preferences saved',
            experience: {
                experienceLevel: user.preferences.experienceLevel,
                discoveryStyle: user.preferences.discoveryStyle,
                preferredLanguage: user.profile.preferredLanguage
            }
        });
    } catch (error) {
        console.error('Save experience error:', error);
        res.status(500).json({ error: 'Failed to save experience preferences' });
    }
});

// POST /api/onboarding/complete - Finalize onboarding
router.post('/complete', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if all required steps are completed
        const requiredSteps = ['welcome', 'location', 'categories', 'preferences', 'experience'];
        const completedSteps = Object.entries(user.onboarding.stepsCompleted)
            .filter(([step, completed]) => requiredSteps.includes(step) && completed)
            .map(([step]) => step);

        if (completedSteps.length < requiredSteps.length) {
            const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));
            return res.status(400).json({
                error: 'Cannot complete onboarding: missing required steps',
                missingSteps,
                completedSteps
            });
        }

        // Calculate time spent (rough estimate)
        const timeSpentMs = Date.now() - user.onboarding.startedAt.getTime();
        const timeSpentMinutes = Math.round(timeSpentMs / (1000 * 60));

        // Mark onboarding as completed
        user.onboarding.isCompleted = true;
        user.onboarding.completedAt = new Date();
        user.onboarding.timeSpentMinutes = timeSpentMinutes;
        user.onboarding.stepsCompleted.review = true;

        await user.save();

        res.json({
            message: 'Onboarding completed successfully!',
            user: {
                firebaseUid: user.firebaseUid,
                profile: user.profile,
                onboarding: user.onboarding,
                timeSpentMinutes
            }
        });
    } catch (error) {
        console.error('Complete onboarding error:', error);
        res.status(500).json({ error: 'Failed to complete onboarding' });
    }
});

// PUT /api/onboarding/skip/:stepName - Skip a step
router.put('/skip/:stepName', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { stepName } = req.params;
        const validSteps = ['welcome', 'location', 'categories', 'preferences', 'experience'];

        if (!validSteps.includes(stepName)) {
            return res.status(400).json({
                error: 'Invalid step name',
                validSteps
            });
        }

        const user = await User.findOne({ firebaseUid: req.user!.firebaseUid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Add to skipped steps
        user.onboarding.skippedSteps.push({
            step: stepName,
            timestamp: new Date()
        });

        // Move to next step
        const stepIndex = validSteps.indexOf(stepName);
        user.onboarding.currentStep = Math.max(user.onboarding.currentStep, stepIndex + 1);

        await user.save();

        res.json({
            message: `Step ${stepName} skipped`,
            onboarding: user.onboarding
        });
    } catch (error) {
        console.error('Skip step error:', error);
        res.status(500).json({ error: 'Failed to skip step' });
    }
});


export default router;
