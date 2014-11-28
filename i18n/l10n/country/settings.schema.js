// Schema format: see http://json-schema.org/
module.exports = {
    'additionalProperties': false,

    'type': 'object',
    'properties': {
        'dashboard': {
            'type': 'object',
            'properties': {
                'metarubrics': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'uniqueItems': true
                },
                'metarubricsGrym': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'uniqueItems': true
                },
                'promoblocks': {
                    'type': 'array',
                    'items': {
                        'type': 'array',
                        'items': {
                            'type': 'string'
                        },
                        'uniqueItems': true
                    },
                    'minItems': 0
                },
                'promoblocksGrym': {
                    'type': 'array',
                    'items': {
                        'type': 'array',
                        'items': {
                            'type': 'string'
                        },
                        'uniqueItems': true
                    }
                }
            },
            'required': ['metarubrics', 'metarubricsGrym', 'promoblocks', 'promoblocksGrym']
        },
        'noresults': {
            'type': 'object',
            'properties': {
                'metarubrics': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'uniqueItems': true
                }
            },
            'required': ['metarubrics']
        },
        'socials': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'uniqueItems': true
        },
        'cityselect': {
            'type': 'object',
            'properties': {
                'countries': {
                    'type': 'array',
                    'items': {
                        'type': 'string'
                    },
                    'uniqueItems': true
                }
            },
            'required': ['countries']
        },
        'geoobjects': {
            'type': 'object',
            'properties': {
                'avoidAddressInName': {
                    'type': 'boolean'
                },
                'infoStrategy': {
                    'type': 'string'
                },
                'showNearStationDistance': {
                    'type': 'boolean'
                }
            },
            'required': ['avoidAddressInName', 'infoStrategy', 'showNearStationDistance']
        },
        'mobileAppPlatforms': {
            'type': 'array',
            'items': {
                'type': 'string'
            },
            'uniqueItems': true
        },
        'firms': {
            'type': 'object',
            'properties': {
                'showDrilldown': {
                    'type': 'boolean'
                },
                'showStations': {
                    'type': 'boolean'
                }
            },
            'required': ['showDrilldown', 'showStations']
        },
        'feedback': {
            'type': 'object',
            'properties': {
                'reverseRatingOrder': {
                    'type': 'boolean'
                }
            },
            'required': ['reverseRatingOrder']
        },
        'traffic': {
            'type': 'object',
            'properties': {
                'isLeftHand': {
                    'type': 'boolean'
                }
            },
            'required': ['isLeftHand']
        },
        'parkingsMode': {
            'type': 'object',
            'properties': {
                'radius': {
                    'type': 'number'
                },
                'disable': {
                    'type': 'boolean'
                }
            },
            'required': ['radius', 'disable']
        },
        filtersInTitles: {
            'type': 'boolean'
        },
        'tools': {
            'type': 'object',
            'properties': {
                'extension': {
                    'type': 'boolean'
                },
                'extensionInlineInstall': {
                    'type': 'boolean'
                }
            },
            'required': ['extension', 'extensionInlineInstall']
        },
        'entrancesPromo': {
            'type': 'object',
            'properties': {
                'firmQuery': {
                    'type': ['string', 'null']
                },
                'excludeProjects': {
                    'type': 'array',
                    'items': {
                        'type': 'number'
                    }
                }
            },
            'required': ['firmQuery', 'excludeProjects']
        }

    }
};
