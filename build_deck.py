import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Colors
    NAVY_DARK = RGBColor(15, 23, 42)      # #0F172A
    NAVY_CARD = RGBColor(30, 41, 59)      # #1E293B
    BLUE_ACCENT = RGBColor(37, 99, 235)   # #2563EB
    BLUE_LIGHT = RGBColor(239, 246, 255)  # #EFF6FF
    WHITE = RGBColor(255, 255, 255)
    TEXT_DARK = RGBColor(15, 23, 42)
    TEXT_MUTED = RGBColor(100, 116, 139)  # #64748B
    CARD_BG = RGBColor(255, 255, 255)
    CARD_BORDER = RGBColor(226, 232, 240) # #E2E8F0
    BG_LIGHT = RGBColor(248, 250, 252)    # #F8FAFC
    GREEN_ACCENT = RGBColor(16, 185, 129) # #10B981

    # Meta constants
    HEADER_TITLE = "Internship Project Presentation  |  Nest Digital"
    HEADER_SUB = "Summer Industry Immersion Programme (SIIP)"
    FOOTER_DEPT = "Department: Computer Applications, Saintgits"
    FOOTER_ORG = "Organisation: Nest Digital"

    # Helpers
    def set_slide_background(slide, color):
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = color

    def add_header_footer(slide, current_slide_num, total_slides=14):
        # Top Header line
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.733), Inches(0.4))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = f"{HEADER_TITLE}    •    {HEADER_SUB}"
        p.font.name = "Calibri"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = BLUE_ACCENT

        # Top separator
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.75), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = RGBColor(226, 232, 240)
        line.line.fill.background()

        # Footer separator
        f_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.02))
        f_line.fill.solid()
        f_line.fill.fore_color.rgb = RGBColor(226, 232, 240)
        f_line.line.fill.background()

        # Footer Left
        f_left = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(5.5), Inches(0.35))
        tf_l = f_left.text_frame
        tf_l.word_wrap = True
        tf_l.margin_left = tf_l.margin_top = tf_l.margin_right = tf_l.margin_bottom = 0
        p_l = tf_l.paragraphs[0]
        p_l.text = f"{FOOTER_DEPT}  |  Saintgits College of Engineering (Autonomous)"
        p_l.font.name = "Calibri"
        p_l.font.size = Pt(10)
        p_l.font.color.rgb = TEXT_MUTED

        # Footer Center
        f_mid = slide.shapes.add_textbox(Inches(6.5), Inches(7.05), Inches(3.5), Inches(0.35))
        tf_m = f_mid.text_frame
        tf_m.margin_left = tf_m.margin_top = tf_m.margin_right = tf_m.margin_bottom = 0
        p_m = tf_m.paragraphs[0]
        p_m.text = FOOTER_ORG
        p_m.font.name = "Calibri"
        p_m.font.size = Pt(10)
        p_m.font.bold = True
        p_m.font.color.rgb = TEXT_MUTED

        # Footer Right (Slide Number)
        f_r = slide.shapes.add_textbox(Inches(11.5), Inches(7.05), Inches(1.033), Inches(0.35))
        tf_r = f_r.text_frame
        tf_r.margin_left = tf_r.margin_top = tf_r.margin_right = tf_r.margin_bottom = 0
        p_r = tf_r.paragraphs[0]
        p_r.text = f"{current_slide_num} / {total_slides}"
        p_r.alignment = PP_ALIGN.RIGHT
        p_r.font.name = "Calibri"
        p_r.font.size = Pt(10)
        p_r.font.color.rgb = TEXT_MUTED

    def add_slide_title(slide, title_text, section_num=None):
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.88), Inches(11.733), Inches(0.65))
        tf = title_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        if section_num:
            r1 = p.add_run()
            r1.text = f"{section_num}  "
            r1.font.name = "Calibri"
            r1.font.size = Pt(22)
            r1.font.bold = True
            r1.font.color.rgb = BLUE_ACCENT

        r2 = p.add_run()
        r2.text = title_text
        r2.font.name = "Calibri"
        r2.font.size = Pt(22)
        r2.font.bold = True
        r2.font.color.rgb = NAVY_DARK

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, NAVY_DARK)

    # Accent decorative top strip
    top_strip = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    top_strip.fill.solid()
    top_strip.fill.fore_color.rgb = BLUE_ACCENT
    top_strip.line.fill.background()

    # Presentation category badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(0.85), Inches(5.8), Inches(0.42))
    badge.fill.solid()
    badge.fill.fore_color.rgb = NAVY_CARD
    badge.line.color.rgb = BLUE_ACCENT
    b_tf = badge.text_frame
    b_p = b_tf.paragraphs[0]
    b_p.text = "INTERNSHIP PROJECT PRESENTATION  |  NEST DIGITAL"
    b_p.font.name = "Calibri"
    b_p.font.size = Pt(11)
    b_p.font.bold = True
    b_p.font.color.rgb = RGBColor(147, 197, 253)

    # Main Project Title
    t_box = s1.shapes.add_textbox(Inches(0.9), Inches(1.4), Inches(11.5), Inches(1.8))
    t_tf = t_box.text_frame
    t_tf.word_wrap = True
    t_p1 = t_tf.paragraphs[0]
    t_p1.text = "FoodieHub"
    t_p1.font.name = "Calibri"
    t_p1.font.size = Pt(46)
    t_p1.font.bold = True
    t_p1.font.color.rgb = WHITE

    t_p2 = t_tf.add_paragraph()
    t_p2.text = "A Smart Restaurant Discovery, Food Ordering & Table Reservation Platform"
    t_p2.font.name = "Calibri"
    t_p2.font.size = Pt(22)
    t_p2.font.color.rgb = RGBColor(203, 213, 225)
    t_p2.space_before = Pt(8)

    # Sub-banner
    sub_box = s1.shapes.add_textbox(Inches(0.9), Inches(3.2), Inches(11.5), Inches(0.5))
    s_tf = sub_box.text_frame
    s_p = s_tf.paragraphs[0]
    s_p.text = "Summer Industry Immersion Programme (SIIP)"
    s_p.font.name = "Calibri"
    s_p.font.size = Pt(16)
    s_p.font.bold = True
    s_p.font.color.rgb = BLUE_ACCENT

    # Divider
    div = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.9), Inches(3.8), Inches(11.533), Inches(0.02))
    div.fill.solid()
    div.fill.fore_color.rgb = RGBColor(51, 65, 85)
    div.line.fill.background()

    # Two column info cards at bottom of title slide
    # Presenter Card
    p_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(4.1), Inches(5.6), Inches(2.6))
    p_card.fill.solid()
    p_card.fill.fore_color.rgb = NAVY_CARD
    p_card.line.color.rgb = RGBColor(51, 65, 85)
    p_tf = p_card.text_frame
    p_tf.word_wrap = True
    p_tf.margin_left = p_tf.margin_top = Inches(0.3)

    p1 = p_tf.paragraphs[0]
    p1.text = "Presented By:"
    p1.font.name = "Calibri"
    p1.font.size = Pt(12)
    p1.font.color.rgb = RGBColor(148, 163, 184)

    p2 = p_tf.add_paragraph()
    p2.text = "Fahad Ansari"
    p2.font.name = "Calibri"
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = WHITE
    p2.space_before = Pt(4)

    p3 = p_tf.add_paragraph()
    p3.text = "Roll No: [Your Roll No]"
    p3.font.name = "Calibri"
    p3.font.size = Pt(14)
    p3.font.color.rgb = RGBColor(226, 232, 240)
    p3.space_before = Pt(4)

    p4 = p_tf.add_paragraph()
    p4.text = "MCA, Batch 2025 – 27"
    p4.font.name = "Calibri"
    p4.font.size = Pt(13)
    p4.font.color.rgb = RGBColor(148, 163, 184)
    p4.space_before = Pt(4)

    p5 = p_tf.add_paragraph()
    p5.text = "Department: Computer Applications, Saintgits"
    p5.font.name = "Calibri"
    p5.font.size = Pt(12)
    p5.font.color.rgb = RGBColor(148, 163, 184)
    p5.space_before = Pt(2)

    # Organisation Card
    o_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(4.1), Inches(5.6), Inches(2.6))
    o_card.fill.solid()
    o_card.fill.fore_color.rgb = NAVY_CARD
    o_card.line.color.rgb = RGBColor(51, 65, 85)
    o_tf = o_card.text_frame
    o_tf.word_wrap = True
    o_tf.margin_left = o_tf.margin_top = Inches(0.3)

    op1 = o_tf.paragraphs[0]
    op1.text = "Internship Host:"
    op1.font.name = "Calibri"
    op1.font.size = Pt(12)
    op1.font.color.rgb = RGBColor(148, 163, 184)

    op2 = o_tf.add_paragraph()
    op2.text = "Nest Digital"
    op2.font.name = "Calibri"
    op2.font.size = Pt(20)
    op2.font.bold = True
    op2.font.color.rgb = WHITE
    op2.space_before = Pt(4)

    op3 = o_tf.add_paragraph()
    op3.text = "Period: 18-05-2026 to 02-07-2026 (6 Weeks)"
    op3.font.name = "Calibri"
    op3.font.size = Pt(14)
    op3.font.color.rgb = RGBColor(226, 232, 240)
    op3.space_before = Pt(4)

    op4 = o_tf.add_paragraph()
    op4.text = "Role: Web Development (Front End) Intern"
    op4.font.name = "Calibri"
    op4.font.size = Pt(13)
    op4.font.color.rgb = RGBColor(148, 163, 184)
    op4.space_before = Pt(4)

    op5 = o_tf.add_paragraph()
    op5.text = "Saintgits College of Engineering (Autonomous)"
    op5.font.name = "Calibri"
    op5.font.size = Pt(12)
    op5.font.color.rgb = RGBColor(148, 163, 184)
    op5.space_before = Pt(2)


    # ==========================================
    # SLIDE 2: AGENDA
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, BG_LIGHT)
    add_header_footer(s2, 2)
    add_slide_title(s2, "Presentation Agenda")

    agenda_items = [
        ("01", "🏢", "Introduction to the Organization"),
        ("02", "🎯", "Internship Objectives"),
        ("03", "💡", "Technologies and Tools Used"),
        ("04", "📋", "Tasks and Responsibilities Assigned"),
        ("05", "🚀", "Project Overview and Individual Contributions"),
        ("06", "⚙️", "Technical Implementation"),
        ("07", "📊", "Results and Outcomes"),
        ("08", "✨", "Innovation and Improvements"),
        ("09", "🎓", "Skills Acquired and Learning Outcomes"),
        ("10", "⚡", "Challenges Faced and Solutions"),
        ("11", "🔮", "Future Scope"),
        ("12", "✅", "Conclusion and Overall Internship Experience")
    ]

    col_w = Inches(5.7)
    card_h = Inches(0.72)
    gap_y = Inches(0.14)
    start_y = Inches(1.65)

    for i, (num, icon, title) in enumerate(agenda_items):
        col = 0 if i < 6 else 1
        row = i if i < 6 else i - 6
        x = Inches(0.8) if col == 0 else Inches(6.8)
        y = start_y + row * (card_h + gap_y)

        c = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, col_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        c.line.width = Pt(1)

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = Inches(0.25)
        ctf.margin_top = Inches(0.16)
        cp = ctf.paragraphs[0]

        r_num = cp.add_run()
        r_num.text = f"{num}   "
        r_num.font.name = "Calibri"
        r_num.font.size = Pt(14)
        r_num.font.bold = True
        r_num.font.color.rgb = BLUE_ACCENT

        r_icon = cp.add_run()
        r_icon.text = f"{icon}  "
        r_icon.font.name = "Calibri"
        r_icon.font.size = Pt(14)

        r_title = cp.add_run()
        r_title.text = title
        r_title.font.name = "Calibri"
        r_title.font.size = Pt(13)
        r_title.font.bold = True
        r_title.font.color.rgb = TEXT_DARK


    # ==========================================
    # SLIDE 3: 01 INTRODUCTION TO THE ORGANIZATION
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, BG_LIGHT)
    add_header_footer(s3, 3)
    add_slide_title(s3, "Introduction to the Organisation", "01")

    # Left Card: About Nest Digital
    c_left = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.65), Inches(5.7), Inches(5.0))
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = CARD_BG
    c_left.line.color.rgb = CARD_BORDER
    cl_tf = c_left.text_frame
    cl_tf.word_wrap = True
    cl_tf.margin_left = cl_tf.margin_top = Inches(0.4)

    p = cl_tf.paragraphs[0]
    p.text = "About Nest Digital"
    p.font.name = "Calibri"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    bullets_org = [
        "Nest Digital is a premier software engineering & digital transformation enterprise based in India.",
        "Specialises in building modern cloud platforms, enterprise web applications, and robust IoT/embedded solutions.",
        "Engineering culture emphasises modular frontend architecture, responsive design, and scalable cloud databases.",
        "Dedicated industry immersion programme prepares interns through structured training followed by enterprise project delivery."
    ]
    for b in bullets_org:
        bp = cl_tf.add_paragraph()
        bp.text = f"•  {b}"
        bp.font.name = "Calibri"
        bp.font.size = Pt(13.5)
        bp.font.color.rgb = RGBColor(51, 65, 85)
        bp.space_before = Pt(14)

    # Right Card: My Internship
    c_right = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.65), Inches(5.7), Inches(5.0))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = CARD_BG
    c_right.line.color.rgb = CARD_BORDER
    cr_tf = c_right.text_frame
    cr_tf.word_wrap = True
    cr_tf.margin_left = cr_tf.margin_top = Inches(0.4)

    p = cr_tf.paragraphs[0]
    p.text = "My Internship at Nest Digital"
    p.font.name = "Calibri"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    intern_details = [
        ("Assigned Role", "Web Development (Front End) Intern"),
        ("Primary Technology", "Angular 17+, TypeScript & Supabase BaaS"),
        ("Academic Programme", "Summer Industry Immersion Programme (SIIP)"),
        ("Duration", "18 May 2026 – 02 July 2026 (6 Weeks)"),
        ("Attendance Record", "100% Consistent Attendance Maintained"),
        ("Delivery Mode", "Agile weekly reporting, sprint reviews & prototype builds")
    ]
    for label, val in intern_details:
        bp = cr_tf.add_paragraph()
        r1 = bp.add_run()
        r1.text = f"{label}: "
        r1.font.bold = True
        r1.font.color.rgb = BLUE_ACCENT
        r2 = bp.add_run()
        r2.text = val
        r2.font.color.rgb = TEXT_DARK
        bp.font.name = "Calibri"
        bp.font.size = Pt(13)
        bp.space_before = Pt(11)


    # ==========================================
    # SLIDE 4: 02 INTERNSHIP OBJECTIVES
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, BG_LIGHT)
    add_header_footer(s4, 4)
    add_slide_title(s4, "Internship Objectives", "02")

    objectives = [
        ("1", "Learn Front-End Fundamentals", "Build a solid foundation in HTML5, CSS3, modern flexbox/grid, and Bootstrap 5 for crafting responsive, accessible user interfaces."),
        ("2", "Master Angular Framework", "Develop high-performance Single Page Applications (SPAs) with Angular Standalone Components, routing, forms, and RxJS reactive streams."),
        ("3", "Work with Real-World REST APIs", "Consume external REST APIs (DummyJSON recipes, Unsplash media), handle asynchronous streams, data modeling, and fallback state."),
        ("4", "Collaborate in a Team Setting", "Plan and prototype user experiences collaboratively with teammates using AI-assisted prototyping tools (Antigravity AI) and Git workflows."),
        ("5", "Deliver an Individual Project", "Architect, develop, test, and deploy a complete production-grade web application — FoodieHub — from concept to completion."),
        ("6", "Follow Industry Practices", "Implement Role-Based Access Control (RBAC), route guards, database security (RLS), real-time updates, and clean modular code.")
    ]

    card_w = Inches(3.7)
    card_h = Inches(2.35)
    gap_x = Inches(0.3)
    gap_y = Inches(0.3)
    start_x = Inches(0.8)
    start_y = Inches(1.65)

    for i, (num, heading, desc) in enumerate(objectives):
        col = i % 3
        row = i // 3
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)

        c = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, card_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = Inches(0.25)

        p = ctf.paragraphs[0]
        r_num = p.add_run()
        r_num.text = f"{num}.  "
        r_num.font.bold = True
        r_num.font.color.rgb = BLUE_ACCENT
        r_title = p.add_run()
        r_title.text = heading
        r_title.font.bold = True
        r_title.font.color.rgb = NAVY_DARK
        p.font.name = "Calibri"
        p.font.size = Pt(14)

        p2 = ctf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(71, 85, 105)
        p2.space_before = Pt(8)


    # ==========================================
    # SLIDE 5: 03 TECHNOLOGIES AND TOOLS USED
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, BG_LIGHT)
    add_header_footer(s5, 5)
    add_slide_title(s5, "Technologies and Tools Used", "03")

    tech_cards = [
        ("Frontend Technologies", [
            ("Angular 17 / 21", "Standalone Components & modern control flow"),
            ("TypeScript 5.4+", "Strict static typing & interfaces"),
            ("RxJS Reactive Streams", "BehaviorSubject, forkJoin & state handling"),
            ("Angular Router & Forms", "Route guards, reactive forms & validation"),
            ("Bootstrap 5.3.8", "Modern responsive grid & component styling")
        ]),
        ("Backend & Database", [
            ("Supabase PostgreSQL", "Relational database with automated triggers"),
            ("Supabase Auth", "Secure session & token authentication"),
            ("Row Level Security (RLS)", "Strict table-level authorization policies"),
            ("Supabase Realtime", "Live WebSocket subscriptions for orders"),
            ("Offline Fallback Mode", "Robust localStorage simulation engine")
        ]),
        ("External APIs & Data", [
            ("DummyJSON Recipes API", "100+ recipe catalog with nutrition info"),
            ("Curated Mock Beverages", "Signature drink recipes with luxury items"),
            ("Dynamic Menu Aggregator", "Merging cloud DB & external REST data"),
            ("Unsplash Food CDN", "High-resolution optimized culinary assets"),
            ("Custom Storage Bus", "Real-time browser event dispatching")
        ]),
        ("Testing & Development Tools", [
            ("Angular CLI & npm", "Automated project scaffolding & builds"),
            ("Git & GitHub", "Branching, commit history & version control"),
            ("Visual Studio Code", "Code editing, linting & Prettier formatting"),
            ("Karma & Jasmine", "Unit testing framework & test runners"),
            ("Antigravity AI", "AI-assisted rapid UI prototyping tool")
        ])
    ]

    card_w = Inches(2.75)
    card_h = Inches(5.0)
    gap_x = Inches(0.24)
    start_x = Inches(0.8)
    start_y = Inches(1.65)

    for i, (category, items) in enumerate(tech_cards):
        x = start_x + i * (card_w + gap_x)
        c = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, start_y, card_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = Inches(0.25)

        p = ctf.paragraphs[0]
        p.text = category
        p.font.name = "Calibri"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = BLUE_ACCENT

        for title, detail in items:
            bp = ctf.add_paragraph()
            r1 = bp.add_run()
            r1.text = f"• {title}\n"
            r1.font.bold = True
            r1.font.color.rgb = NAVY_DARK
            r2 = bp.add_run()
            r2.text = f"   {detail}"
            r2.font.color.rgb = TEXT_MUTED
            bp.font.name = "Calibri"
            bp.font.size = Pt(11)
            bp.space_before = Pt(8)


    # ==========================================
    # SLIDE 6: 04 TASKS AND RESPONSIBILITIES ASSIGNED
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, BG_LIGHT)
    add_header_footer(s6, 6)
    add_slide_title(s6, "Tasks and Responsibilities Assigned", "04")

    # Subtitle note
    note_box = s6.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.3))
    ntf = note_box.text_frame
    np = ntf.paragraphs[0]
    np.text = "Week-wise progress recorded throughout the 6-week internship period:"
    np.font.name = "Calibri"
    np.font.size = Pt(12)
    np.font.italic = True
    np.font.color.rgb = TEXT_MUTED

    weeks = [
        ("Week 1", "18 – 24 May", "Front-End Training", "HTML5, CSS3, modern layout techniques, Bootstrap grid, Angular standalone components, sample websites built.", "Training 100%"),
        ("Week 2", "25 – 31 May", "Team Prototype & AI Design", "Requirements analysis, user personas, UI mockups built using Antigravity AI tool, FoodieHub individual project assigned.", "Project 10%"),
        ("Week 3", "1 – 7 Jun", "Architecture & Planning", "Finalised FoodieHub restaurant site specifications, designed Supabase database schema, route structure & ER diagrams.", "Project 20%"),
        ("Week 4", "8 – 14 Jun", "Core Modules & API Integration", "Built Menu, Food Details, category filtering, search engine, integrated DummyJSON API and custom beverage dataset.", "Project 50%"),
        ("Week 5", "15 – 21 Jun", "Cart, Reservations & Auth", "Implemented reactive CartService, table booking engine, Supabase Auth, customer profile management & order tracking.", "Project 80%"),
        ("Week 6", "22 – 28 Jun", "Staff Dashboards & Delivery", "Built Manager Portal & Master Admin panel with RBAC guards, offline fallback mode, end-to-end testing & presentation prep.", "Project 100%")
    ]

    card_w = Inches(1.85)
    card_h = Inches(4.7)
    gap_x = Inches(0.125)
    start_x = Inches(0.8)
    start_y = Inches(1.9)

    for i, (wk, dates, stage, details, progress) in enumerate(weeks):
        x = start_x + i * (card_w + gap_x)
        c = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, start_y, card_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = Inches(0.2)

        # Week Header
        p1 = ctf.paragraphs[0]
        p1.text = wk
        p1.font.name = "Calibri"
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = BLUE_ACCENT

        p_date = ctf.add_paragraph()
        p_date.text = dates
        p_date.font.name = "Calibri"
        p_date.font.size = Pt(10)
        p_date.font.color.rgb = TEXT_MUTED

        p_stage = ctf.add_paragraph()
        p_stage.text = stage
        p_stage.font.name = "Calibri"
        p_stage.font.size = Pt(12)
        p_stage.font.bold = True
        p_stage.font.color.rgb = NAVY_DARK
        p_stage.space_before = Pt(8)

        p_det = ctf.add_paragraph()
        p_det.text = details
        p_det.font.name = "Calibri"
        p_det.font.size = Pt(10.5)
        p_det.font.color.rgb = RGBColor(71, 85, 105)
        p_det.space_before = Pt(8)

        p_prog = ctf.add_paragraph()
        p_prog.text = f"\nStatus: {progress}"
        p_prog.font.name = "Calibri"
        p_prog.font.size = Pt(11)
        p_prog.font.bold = True
        p_prog.font.color.rgb = GREEN_ACCENT
        p_prog.space_before = Pt(10)


    # ==========================================
    # SLIDE 7: 05 PROJECT OVERVIEW & CONTRIBUTIONS
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, BG_LIGHT)
    add_header_footer(s7, 7)
    add_slide_title(s7, "Project Overview and Individual Contributions", "05")

    # Overview box
    c_ov = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.65), Inches(7.5), Inches(2.2))
    c_ov.fill.solid()
    c_ov.fill.fore_color.rgb = CARD_BG
    c_ov.line.color.rgb = CARD_BORDER
    ov_tf = c_ov.text_frame
    ov_tf.word_wrap = True
    ov_tf.margin_left = ov_tf.margin_top = Inches(0.3)

    p = ov_tf.paragraphs[0]
    p.text = "FoodieHub – What It Does"
    p.font.name = "Calibri"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    p_desc = ov_tf.add_paragraph()
    p_desc.text = "FoodieHub is an enterprise-ready restaurant discovery, real-time food delivery, and dine-in reservation Single Page Application (SPA). It bridges the gap between hungry diners, kitchen management, and executive restaurant administrators through seamless multi-role workflows."
    p_desc.font.name = "Calibri"
    p_desc.font.size = Pt(12)
    p_desc.font.color.rgb = RGBColor(71, 85, 105)
    p_desc.space_before = Pt(6)

    # Contributions Box
    c_cb = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.05), Inches(7.5), Inches(2.6))
    c_cb.fill.solid()
    c_cb.fill.fore_color.rgb = CARD_BG
    c_cb.line.color.rgb = CARD_BORDER
    cb_tf = c_cb.text_frame
    cb_tf.word_wrap = True
    cb_tf.margin_left = cb_tf.margin_top = Inches(0.3)

    p = cb_tf.paragraphs[0]
    p.text = "My Individual Contributions"
    p.font.name = "Calibri"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    contribs = [
        "Architected and built all 14 Angular standalone views and services independently.",
        "Integrated DummyJSON recipes API and engineered hybrid catalog with mock drinks and custom admin items.",
        "Engineered reactive CartService and complete checkout pipeline with tax, delivery fees, and order notes.",
        "Created Table Reservation engine with date/time pickers and instant confirmation codes.",
        "Implemented 3-tier Role-Based Access Control (Customer, Manager, Master Admin) with route guards."
    ]
    for c_item in contribs:
        bp = cb_tf.add_paragraph()
        bp.text = f"•  {c_item}"
        bp.font.name = "Calibri"
        bp.font.size = Pt(11.5)
        bp.font.color.rgb = RGBColor(51, 65, 85)
        bp.space_before = Pt(4)

    # Right Stat Cards (Counters like in the reference!)
    stats = [
        ("14", "Pages Built", "Standalone components & views"),
        ("100+", "Menu Items", "Dishes, cuisines & mocktails"),
        ("6", "Database Tables", "Supabase PostgreSQL with RLS"),
        ("3", "User Roles", "Customer, Manager, Master Admin")
    ]
    for i, (val, label, sub) in enumerate(stats):
        sy = Inches(1.65) + i * Inches(1.28)
        sc = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.6), sy, Inches(3.933), Inches(1.15))
        sc.fill.solid()
        sc.fill.fore_color.rgb = CARD_BG
        sc.line.color.rgb = CARD_BORDER
        stf = sc.text_frame
        stf.word_wrap = True
        stf.margin_left = Inches(0.3)
        stf.margin_top = Inches(0.18)

        sp = stf.paragraphs[0]
        r_val = sp.add_run()
        r_val.text = f"{val}  "
        r_val.font.name = "Calibri"
        r_val.font.size = Pt(28)
        r_val.font.bold = True
        r_val.font.color.rgb = BLUE_ACCENT

        r_lbl = sp.add_run()
        r_lbl.text = label
        r_lbl.font.name = "Calibri"
        r_lbl.font.size = Pt(15)
        r_lbl.font.bold = True
        r_lbl.font.color.rgb = NAVY_DARK

        sp_sub = stf.add_paragraph()
        sp_sub.text = sub
        sp_sub.font.name = "Calibri"
        sp_sub.font.size = Pt(11)
        sp_sub.font.color.rgb = TEXT_MUTED


    # ==========================================
    # SLIDE 8: 06 TECHNICAL IMPLEMENTATION
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, BG_LIGHT)
    add_header_footer(s8, 8)
    add_slide_title(s8, "Technical Implementation & Multi-Tier Architecture", "06")

    layers = [
        ("UI Layer (Presentation)", [
            "14 Angular Standalone Components without NgModule overhead",
            "Responsive layout with Bootstrap 5.3 & custom CSS styling",
            "Reactive Forms with inline validation & error handling",
            "Single Page Application routing with animated route transitions"
        ]),
        ("Service & State Layer (Logic)", [
            "RxJS BehaviorSubjects for shared reactive state (Cart, User, Orders)",
            "Dynamic Menu Aggregator fusing external REST APIs and database data",
            "Availability override state synchronized instantaneously across components",
            "Custom window DOM events & local broadcast bus for zero latency"
        ]),
        ("Data & Security Layer (Backend)", [
            "Supabase PostgreSQL database with UUIDs, indexes & foreign key cascades",
            "Row Level Security (RLS) policies securing profiles, orders & items",
            "Supabase Auth with persistent session storage & password hashing",
            "Full localStorage fallback mode ensuring 100% offline demonstration"
        ]),
        ("Access Control & Guards (RBAC)", [
            "adminGuard restricting Admin Control Panel to single Master Admin",
            "managerGuard restricting kitchen order pipeline to approved managers",
            "Manager registration & admin approval workflow queue (pending/approved)",
            "Multi-tab session synchronization across browser windows"
        ])
    ]

    card_w = Inches(5.7)
    card_h = Inches(2.35)
    gap_x = Inches(0.3)
    gap_y = Inches(0.3)
    start_x = Inches(0.8)
    start_y = Inches(1.65)

    for i, (title, points) in enumerate(layers):
        col = i % 2
        row = i // 2
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)

        c = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, card_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = Inches(0.25)

        p = ctf.paragraphs[0]
        p.text = title
        p.font.name = "Calibri"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = BLUE_ACCENT

        for pt in points:
            bp = ctf.add_paragraph()
            bp.text = f"• {pt}"
            bp.font.name = "Calibri"
            bp.font.size = Pt(11.5)
            bp.font.color.rgb = RGBColor(51, 65, 85)
            bp.space_before = Pt(3)


    # ==========================================
    # SLIDE 9: 07 RESULTS AND OUTCOMES
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, BG_LIGHT)
    add_header_footer(s9, 9)
    add_slide_title(s9, "Results and Verified Outcomes", "07")

    # Insert Architecture diagram if exists
    arch_path = "arch.png"
    sub_path = "supabase.png"
    has_arch = os.path.exists(arch_path)
    has_sub = os.path.exists(sub_path)

    # Left visual card
    c_img = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.65), Inches(6.0), Inches(5.0))
    c_img.fill.solid()
    c_img.fill.fore_color.rgb = CARD_BG
    c_img.line.color.rgb = CARD_BORDER

    if has_arch:
        try:
            s9.shapes.add_picture(arch_path, Inches(1.0), Inches(2.1), width=Inches(5.6))
        except Exception as e:
            pass
    
    ci_tf = c_img.text_frame
    ci_tf.margin_left = Inches(0.3)
    ci_tf.margin_top = Inches(0.2)
    cip = ci_tf.paragraphs[0]
    cip.text = "System Architecture & Data Flow (FoodieHub)"
    cip.font.name = "Calibri"
    cip.font.size = Pt(14)
    cip.font.bold = True
    cip.font.color.rgb = NAVY_DARK

    # Right Card: Outcomes Achieved
    c_res = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.1), Inches(1.65), Inches(5.4), Inches(5.0))
    c_res.fill.solid()
    c_res.fill.fore_color.rgb = CARD_BG
    c_res.line.color.rgb = CARD_BORDER
    cr_tf = c_res.text_frame
    cr_tf.word_wrap = True
    cr_tf.margin_left = cr_tf.margin_top = Inches(0.3)

    p = cr_tf.paragraphs[0]
    p.text = "Outcomes Achieved"
    p.font.name = "Calibri"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    outcomes = [
        "FoodieHub completed and tested at 100% within the six-week immersion period.",
        "All 14 Single Page Application views operational with zero console exceptions.",
        "Full order lifecycle functioning smoothly: browsing -> cart -> checkout -> order confirmation -> live status.",
        "Table reservation engine operational with party size validation and unique reservation code generation."
    ]
    for o in outcomes:
        bp = cr_tf.add_paragraph()
        bp.text = f"•  {o}"
        bp.font.name = "Calibri"
        bp.font.size = Pt(12)
        bp.font.color.rgb = RGBColor(51, 65, 85)
        bp.space_before = Pt(8)

    p_v = cr_tf.add_paragraph()
    p_v.text = "Verified Results:"
    p_v.font.name = "Calibri"
    p_v.font.size = Pt(15)
    p_v.font.bold = True
    p_v.font.color.rgb = BLUE_ACCENT
    p_v.space_before = Pt(14)

    verified = [
        "Role-Based Guards strictly isolate Customer, Manager, and Admin routes.",
        "Manager orders queue updates dynamically upon customer checkout.",
        "Zero-downtime offline fallback maintains 100% features when database is disconnected."
    ]
    for v in verified:
        bp = cr_tf.add_paragraph()
        bp.text = f"✓  {v}"
        bp.font.name = "Calibri"
        bp.font.size = Pt(11.5)
        bp.font.bold = True
        bp.font.color.rgb = GREEN_ACCENT
        bp.space_before = Pt(4)


    # ==========================================
    # SLIDE 10: 08 INNOVATION AND IMPROVEMENTS
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, BG_LIGHT)
    add_header_footer(s10, 10)
    add_slide_title(s10, "Innovation and Improvements", "08")

    innovations = [
        ("1", "Real-Time Order Pipeline", "Supabase Realtime PostgreSQL channel (public:orders:realtime) broadcasts live status updates instantly across customer and manager screens without manual refresh."),
        ("2", "Dual-Tier Fallback Resilience", "Engineered an intelligent fallback engine that seamlessly switches to full localStorage mock mode if Supabase credentials are missing or network drops."),
        ("3", "Governed Manager Approval Flow", "Unlike typical open portals, manager applications enter a 'pending' state machine requiring explicit Master Admin approval before granting operational access."),
        ("4", "Hybrid Menu Aggregation", "Seamlessly merges external REST recipe data (DummyJSON) with curated mocktails and custom admin dishes while eliminating duplicates."),
        ("5", "Instant Booking Code Engine", "Generates unique alphanumeric table booking codes with validation for party size, date constraints, and special dietary requests."),
        ("6", "Reactive Availability Toggles", "Admins and managers can toggle dish availability in real time; unavailable dishes immediately reflect in menus to avoid cancelled orders.")
    ]

    card_w = Inches(3.7)
    card_h = Inches(2.35)
    gap_x = Inches(0.3)
    gap_y = Inches(0.3)
    start_x = Inches(0.8)
    start_y = Inches(1.65)

    for i, (num, heading, desc) in enumerate(innovations):
        col = i % 3
        row = i // 3
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)

        c = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, card_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = Inches(0.25)

        p = ctf.paragraphs[0]
        r_num = p.add_run()
        r_num.text = f"{num}.  "
        r_num.font.bold = True
        r_num.font.color.rgb = BLUE_ACCENT
        r_title = p.add_run()
        r_title.text = heading
        r_title.font.bold = True
        r_title.font.color.rgb = NAVY_DARK
        p.font.name = "Calibri"
        p.font.size = Pt(14)

        p2 = ctf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(71, 85, 105)
        p2.space_before = Pt(8)


    # ==========================================
    # SLIDE 11: 09 SKILLS ACQUIRED & LEARNING OUTCOMES
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11, BG_LIGHT)
    add_header_footer(s11, 11)
    add_slide_title(s11, "Skills Acquired and Learning Outcomes", "09")

    skills = [
        ("1", "Angular & TypeScript Mastery", "Mastered standalone components, dependency injection, routing with guards, reactive forms, and strong static typing."),
        ("2", "REST API & Data Modeling", "Consumed third-party REST endpoints, handled JSON data mapping, asynchronous forkJoin and switchMap pipelines."),
        ("3", "BaaS & Relational Databases", "Configured Supabase PostgreSQL, wrote custom SQL triggers, managed foreign keys, and deployed Row Level Security policies."),
        ("4", "Security & Role-Based Access", "Designed enterprise RBAC patterns, protected staff routes, implemented persistent auth sessions, and approval state machines."),
        ("5", "Testing & Debugging", "Performed component testing with Karma/Jasmine, debugged complex state race conditions, and monitored network waterfalls."),
        ("6", "Agile & Team Collaboration", "Collaborated on team prototypes, practiced structured weekly reporting, Git version control, and AI-assisted prototyping.")
    ]

    for i, (num, heading, desc) in enumerate(skills):
        col = i % 3
        row = i // 3
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)

        c = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, card_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = Inches(0.25)

        p = ctf.paragraphs[0]
        r_num = p.add_run()
        r_num.text = f"{num}.  "
        r_num.font.bold = True
        r_num.font.color.rgb = BLUE_ACCENT
        r_title = p.add_run()
        r_title.text = heading
        r_title.font.bold = True
        r_title.font.color.rgb = NAVY_DARK
        p.font.name = "Calibri"
        p.font.size = Pt(14)

        p2 = ctf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(71, 85, 105)
        p2.space_before = Pt(8)


    # ==========================================
    # SLIDE 12: 10 CHALLENGES FACED AND SOLUTIONS
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12, BG_LIGHT)
    add_header_footer(s12, 12)
    add_slide_title(s12, "Challenges Faced and Solutions", "10")

    # Table layout
    table_shape = s12.shapes.add_table(7, 2, Inches(0.8), Inches(1.65), Inches(11.733), Inches(4.9))
    tbl = table_shape.table
    tbl.columns[0].width = Inches(4.5)
    tbl.columns[1].width = Inches(7.233)

    # Header Row
    tbl.cell(0, 0).text = "Technical Challenge"
    tbl.cell(0, 1).text = "How It Was Addressed & Resolved"
    for j in range(2):
        cell = tbl.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY_DARK
        p = cell.text_frame.paragraphs[0]
        p.font.name = "Calibri"
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = WHITE

    challenges_data = [
        ("DummyJSON recipe API lacked beverages and drinks", "Engineered custom mock drinks dataset with luxury items (e.g. Gold Flake Cappuccino) and blended them seamlessly."),
        ("Database connectivity risks during live evaluation", "Built an automated localStorage simulation mode with seed orders and reservations for guaranteed zero downtime."),
        ("Real-time order sync across tabs without excessive polling", "Configured Supabase Realtime channel + browser storage event dispatchers for instant bi-directional updates."),
        ("Preventing unauthorized staff access to kitchen orders", "Implemented role-based staff authentication and an Admin approval workflow (pending -> approved)."),
        ("Synchronizing cart count and availability across 14 pages", "Centralized cart state in RxJS BehaviorSubject with local persistence so cart items persist through reloads."),
        ("Handling dish availability without modifying external API", "Built an availability override mapping stored locally and merged during recipe enrichment.")
    ]

    for idx, (ch, sol) in enumerate(challenges_data):
        row_idx = idx + 1
        c0 = tbl.cell(row_idx, 0)
        c1 = tbl.cell(row_idx, 1)

        c0.text = ch
        c1.text = sol

        for c, text_val, is_sol in [(c0, ch, False), (c1, sol, True)]:
            c.fill.solid()
            c.fill.fore_color.rgb = RGBColor(241, 245, 249) if row_idx % 2 == 1 else WHITE
            p = c.text_frame.paragraphs[0]
            p.font.name = "Calibri"
            p.font.size = Pt(11)
            p.font.color.rgb = NAVY_DARK if is_sol else BLUE_ACCENT
            if not is_sol:
                p.font.bold = True


    # ==========================================
    # SLIDE 13: 11 FUTURE SCOPE
    # ==========================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13, BG_LIGHT)
    add_header_footer(s13, 13)
    add_slide_title(s13, "Future Scope", "11")

    scopes = [
        ("1", "Payment Gateway Integration", "Integrate Razorpay and Stripe APIs for secure online payments, UPI, Apple Pay, and digital wallet transactions."),
        ("2", "Live GPS Order Tracking", "Add interactive OpenStreetMap / Google Maps view for customers to track delivery riders in real time from kitchen to doorstep."),
        ("3", "AI-Powered Dish Recommender", "Incorporate machine learning models to suggest customized dishes and pairings based on past orders and dietary preferences."),
        ("4", "Customer Loyalty & Rewards", "Implement dynamic reward points, digital punch cards, and exclusive promotional voucher codes for recurring diners."),
        ("5", "Progressive Web App (PWA)", "Add service worker support for offline caching and push notifications on mobile devices without native app store installation."),
        ("6", "Contactless Table QR Ordering", "Enable in-restaurant diners to scan a table QR code, browse the live menu, and submit orders directly to kitchen screens.")
    ]

    for i, (num, heading, desc) in enumerate(scopes):
        col = i % 3
        row = i // 3
        x = start_x + col * (card_w + gap_x)
        y = start_y + row * (card_h + gap_y)

        c = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, card_w, card_h)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True
        ctf.margin_left = ctf.margin_top = Inches(0.25)

        p = ctf.paragraphs[0]
        r_num = p.add_run()
        r_num.text = f"{num}.  "
        r_num.font.bold = True
        r_num.font.color.rgb = BLUE_ACCENT
        r_title = p.add_run()
        r_title.text = heading
        r_title.font.bold = True
        r_title.font.color.rgb = NAVY_DARK
        p.font.name = "Calibri"
        p.font.size = Pt(14)

        p2 = ctf.add_paragraph()
        p2.text = desc
        p2.font.name = "Calibri"
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(71, 85, 105)
        p2.space_before = Pt(8)


    # ==========================================
    # SLIDE 14: 12 CONCLUSION & OVERALL EXPERIENCE
    # ==========================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14, BG_LIGHT)
    add_header_footer(s14, 14)
    add_slide_title(s14, "Conclusion and Overall Internship Experience", "12")

    # Left Card: Overall Experience
    c_exp = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.65), Inches(5.7), Inches(5.0))
    c_exp.fill.solid()
    c_exp.fill.fore_color.rgb = CARD_BG
    c_exp.line.color.rgb = CARD_BORDER
    ce_tf = c_exp.text_frame
    ce_tf.word_wrap = True
    ce_tf.margin_left = ce_tf.margin_top = Inches(0.4)

    p = ce_tf.paragraphs[0]
    p.text = "Overall Internship Experience"
    p.font.name = "Calibri"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    exp_bullets = [
        "Bridged the gap between academic theory and real-world industrial software engineering practices.",
        "Nest Digital's structured 6-week curriculum provided deep technical confidence in modern Angular and cloud architectures.",
        "Adhering to weekly sprint reports instilled rigorous accountability, planning, and professional communication skills.",
        "Hands-on experience with live APIs, authentication, and database security prepared me for professional software engineering roles."
    ]
    for b in exp_bullets:
        bp = ce_tf.add_paragraph()
        bp.text = f"•  {b}"
        bp.font.name = "Calibri"
        bp.font.size = Pt(12.5)
        bp.font.color.rgb = RGBColor(51, 65, 85)
        bp.space_before = Pt(12)

    # Right Card: Key Outcomes
    c_out = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.65), Inches(5.7), Inches(5.0))
    c_out.fill.solid()
    c_out.fill.fore_color.rgb = CARD_BG
    c_out.line.color.rgb = CARD_BORDER
    co_tf = c_out.text_frame
    co_tf.word_wrap = True
    co_tf.margin_left = co_tf.margin_top = Inches(0.4)

    p = co_tf.paragraphs[0]
    p.text = "Key Project Outcomes"
    p.font.name = "Calibri"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = NAVY_DARK

    key_outcomes = [
        "Completed 100% of structured frontend training and delivered the complete FoodieHub application within 6 weeks.",
        "Engineered 14 fully functional Angular standalone pages with multi-tier access control (Customer, Manager, Admin).",
        "Successfully collaborated on the team prototype while independently completing individual project milestones.",
        "Maintained 100% punctuality and attendance throughout the Summer Industry Immersion Programme (SIIP)."
    ]
    for b in key_outcomes:
        bp = co_tf.add_paragraph()
        bp.text = f"✓  {b}"
        bp.font.name = "Calibri"
        bp.font.size = Pt(12.5)
        bp.font.bold = True
        bp.font.color.rgb = RGBColor(16, 185, 129)
        bp.space_before = Pt(12)


    # ==========================================
    # SLIDE 15: THANK YOU SLIDE
    # ==========================================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15, NAVY_DARK)

    # Accent decorative top strip
    top_strip = s15.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    top_strip.fill.solid()
    top_strip.fill.fore_color.rgb = BLUE_ACCENT
    top_strip.line.fill.background()

    # Thank you box
    ty_box = s15.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.733), Inches(2.2))
    ty_tf = ty_box.text_frame
    ty_tf.word_wrap = True

    p1 = ty_tf.paragraphs[0]
    p1.text = "Thank You!"
    p1.alignment = PP_ALIGN.CENTER
    p1.font.name = "Calibri"
    p1.font.size = Pt(52)
    p1.font.bold = True
    p1.font.color.rgb = WHITE

    p2 = ty_tf.add_paragraph()
    p2.text = "Questions & Feedback are Welcome"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Calibri"
    p2.font.size = Pt(22)
    p2.font.color.rgb = RGBColor(147, 197, 253)
    p2.space_before = Pt(12)

    # Details Box at bottom of Thank you slide
    dt_box = s15.shapes.add_textbox(Inches(0.8), Inches(4.5), Inches(11.733), Inches(1.8))
    dt_tf = dt_box.text_frame
    dt_tf.word_wrap = True

    p3 = dt_tf.paragraphs[0]
    p3.text = "Fahad Ansari  |  MCA 2025 – 27  |  Saintgits College of Engineering (Autonomous)"
    p3.alignment = PP_ALIGN.CENTER
    p3.font.name = "Calibri"
    p3.font.size = Pt(16)
    p3.font.bold = True
    p3.font.color.rgb = WHITE

    p4 = dt_tf.add_paragraph()
    p4.text = "Internship at Nest Digital  •  Project: FoodieHub"
    p4.alignment = PP_ALIGN.CENTER
    p4.font.name = "Calibri"
    p4.font.size = Pt(14)
    p4.font.color.rgb = RGBColor(148, 163, 184)
    p4.space_before = Pt(6)

    # Save
    out_file = "FoodieHub_Internship_Presentation.pptx"
    prs.save(out_file)
    print(f"Presentation generated successfully: {out_file}")

if __name__ == "__main__":
    create_presentation()
