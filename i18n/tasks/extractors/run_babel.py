#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os, sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'bin/i18n'))

from babel.messages.frontend import CommandLineInterface

if __name__ == '__main__':
    CommandLineInterface().run(sys.argv)