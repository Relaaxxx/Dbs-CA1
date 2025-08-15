--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-08-15 15:24:38

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 240 (class 1255 OID 26424)
-- Name: create_comment(integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_comment(IN p_review_id integer, IN p_member_id integer, IN p_content text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_author_id INT;
BEGIN
    SELECT member_id INTO v_author_id FROM review WHERE id = p_review_id;

    IF v_author_id IS NULL THEN
        RAISE EXCEPTION 'Review not found.';
    ELSIF v_author_id = p_member_id THEN
        RAISE EXCEPTION 'You cannot comment on your own review.';
    END IF;

    INSERT INTO comment (review_id, member_id, content)
    VALUES (p_review_id, p_member_id, p_content);
END;
$$;


--
-- TOC entry 241 (class 1255 OID 26425)
-- Name: create_review(integer, integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_review(IN p_member_id integer, IN p_product_id integer, IN p_rating integer, IN p_content text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sale_order so
        JOIN sale_order_item soi ON so.id = soi.sale_order_id
        WHERE so.member_id = p_member_id
          AND soi.product_id = p_product_id
          AND so.status = 'COMPLETED'
    ) THEN
        RAISE EXCEPTION 'You can only review products you have completed ordering.';
    END IF;

    INSERT INTO review (member_id, product_id, rating, content)
    VALUES (p_member_id, p_product_id, p_rating, p_content);
END;
$$;


--
-- TOC entry 242 (class 1255 OID 26426)
-- Name: delete_comment(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_comment(IN p_comment_id integer, IN p_member_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM comment WHERE id = p_comment_id AND member_id = p_member_id
    ) THEN
        RAISE EXCEPTION 'You can only delete your own comment.';
    END IF;

    DELETE FROM comment WHERE id = p_comment_id;
END;
$$;


--
-- TOC entry 243 (class 1255 OID 26427)
-- Name: delete_review(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_review(IN p_review_id integer, IN p_member_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM review WHERE id = p_review_id AND member_id = p_member_id
    ) THEN
        RAISE EXCEPTION 'You can only delete your own review.';
    END IF;

    DELETE FROM review WHERE id = p_review_id;
END;
$$;


--
-- TOC entry 244 (class 1255 OID 26428)
-- Name: get_comments(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_comments(p_review_id integer) RETURNS TABLE(id integer, member_id integer, content text, created_at timestamp without time zone)
    LANGUAGE sql
    AS $$
    SELECT id, member_id, content, created_at
    FROM comment
    WHERE review_id = p_review_id
    ORDER BY created_at ASC;
$$;


--
-- TOC entry 245 (class 1255 OID 26429)
-- Name: get_reviews(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_reviews(p_member_id integer) RETURNS TABLE(id integer, product_id integer, rating integer, content text, created_at timestamp without time zone, updated_at timestamp without time zone)
    LANGUAGE sql
    AS $$
    SELECT id, product_id, rating, content, created_at, updated_at
    FROM review
    WHERE member_id = p_member_id;
$$;


--
-- TOC entry 258 (class 1255 OID 26430)
-- Name: get_sale_order_summary(text, numeric, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sale_order_summary(p_gender text DEFAULT NULL::text, p_min_spent numeric DEFAULT NULL::numeric, p_min_age integer DEFAULT NULL::integer, p_max_age integer DEFAULT NULL::integer) RETURNS TABLE(member_id integer, member_name text, gender text, age integer, total_orders integer, total_items integer, total_spent numeric)
    LANGUAGE sql
    AS $$
    SELECT 
        m.id AS member_id,
        m.username AS member_name,
        m.gender,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.dob))::INT AS age,
        COUNT(DISTINCT so.id) AS total_orders,
        SUM(soi.quantity) AS total_items,
        SUM(soi.quantity * p.unit_price) AS total_spent
    FROM member m
    JOIN sale_order so ON m.id = so.member_id
    JOIN sale_order_item soi ON so.id = soi.sale_order_id
    JOIN product p ON soi.product_id = p.id
    WHERE so.status = 'COMPLETED'
      AND (p_gender IS NULL OR m.gender = p_gender)
      AND (p_min_age IS NULL OR m.dob <= (CURRENT_DATE - INTERVAL '1 year' * p_min_age))
      AND (p_max_age IS NULL OR m.dob >= (CURRENT_DATE - INTERVAL '1 year' * p_max_age))
    GROUP BY m.id, m.username, m.gender, m.dob
    HAVING (p_min_spent IS NULL OR SUM(soi.quantity * p.unit_price) >= p_min_spent)
    ORDER BY total_spent DESC;
$$;


--
-- TOC entry 260 (class 1255 OID 29329)
-- Name: place_orders(integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.place_orders(IN p_member_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cart_id INT;
    v_cart_item RECORD;
    v_stock DECIMAL;
    v_sale_order_id INT;
BEGIN
    -- Find the cart for the member
    SELECT id INTO v_cart_id
    FROM cart
    WHERE member_id = p_member_id
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        RAISE NOTICE 'No cart found for member %', p_member_id;
        RETURN;
    END IF;

    -- Loop through each cart item
    FOR v_cart_item IN
        SELECT ci.id AS cart_item_id,
               ci.product_id,
               ci.quantity,
               p.stock_quantity
        FROM "cartItem" ci
        JOIN product p ON ci.product_id = p.id
        WHERE ci.cart_id = v_cart_id
        ORDER BY ci.id
    LOOP
        v_stock := v_cart_item.stock_quantity;

        -- Check if enough stock
        IF v_stock >= v_cart_item.quantity THEN
            -- Deduct stock
            UPDATE product
            SET stock_quantity = stock_quantity - v_cart_item.quantity
            WHERE id = v_cart_item.product_id;

            -- Create sale order if not already created for this procedure run
            IF v_sale_order_id IS NULL THEN
                INSERT INTO sale_order(member_id, order_datetime, status)
                VALUES (p_member_id, NOW(), 'PACKING')
                RETURNING id INTO v_sale_order_id;
            END IF;

            -- Create sale order item
            INSERT INTO sale_order_item(sale_order_id, product_id, quantity)
            VALUES (v_sale_order_id, v_cart_item.product_id, v_cart_item.quantity);

            -- Remove processed item from cart
            DELETE FROM "cartItem" WHERE id = v_cart_item.cart_item_id;

        ELSE
            -- Not enough stock: skip item, continue with next
            RAISE NOTICE 'Not enough stock for product %, required %, available %',
                v_cart_item.product_id, v_cart_item.quantity, v_stock;
        END IF;
    END LOOP;

    RAISE NOTICE 'Order processing completed for member %', p_member_id;
END;
$$;


--
-- TOC entry 246 (class 1255 OID 32770)
-- Name: place_orders(bigint); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.place_orders(IN p_member_id bigint)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cart_id INT;
    v_cart_item RECORD;
    v_stock DECIMAL;
    v_sale_order_id INT;
BEGIN
    -- Find the cart for the member
    SELECT id INTO v_cart_id
    FROM cart
    WHERE member_id = p_member_id
    LIMIT 1;

    IF v_cart_id IS NULL THEN
        RAISE NOTICE 'No cart found for member %', p_member_id;
        RETURN;
    END IF;

    -- Loop through each cart item
    FOR v_cart_item IN
        SELECT ci.id AS cart_item_id,
               ci.product_id,
               ci.quantity,
               p.stock_quantity
        FROM "cartItem" ci
        JOIN product p ON ci.product_id = p.id
        WHERE ci.cart_id = v_cart_id
        ORDER BY ci.id
    LOOP
        v_stock := v_cart_item.stock_quantity;

        -- Check if enough stock
        IF v_stock >= v_cart_item.quantity THEN
            -- Deduct stock
            UPDATE product
            SET stock_quantity = stock_quantity - v_cart_item.quantity
            WHERE id = v_cart_item.product_id;

            -- Create sale order if not already created for this procedure run
            IF v_sale_order_id IS NULL THEN
                INSERT INTO sale_order(member_id, order_datetime, status)
                VALUES (p_member_id, NOW(), 'PACKING')
                RETURNING id INTO v_sale_order_id;
            END IF;

            -- Create sale order item
            INSERT INTO sale_order_item(sale_order_id, product_id, quantity)
            VALUES (v_sale_order_id, v_cart_item.product_id, v_cart_item.quantity);

            -- Remove processed item from cart
            DELETE FROM "cartItem" WHERE id = v_cart_item.cart_item_id;

        ELSE
            -- Not enough stock: skip item, continue with next
            RAISE NOTICE 'Not enough stock for product %, required %, available %',
                v_cart_item.product_id, v_cart_item.quantity, v_stock;
        END IF;
    END LOOP;

    RAISE NOTICE 'Order processing completed for member %', p_member_id;
END;
$$;


--
-- TOC entry 259 (class 1255 OID 26431)
-- Name: update_review(integer, integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.update_review(IN p_review_id integer, IN p_member_id integer, IN p_rating integer, IN p_content text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM review WHERE id = p_review_id AND member_id = p_member_id
    ) THEN
        RAISE EXCEPTION 'You can only update your own review.';
    END IF;

    UPDATE review
    SET rating = p_rating,
        content = p_content,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_review_id;
END;
$$;


--
-- TOC entry 231 (class 1259 OID 26538)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 27276)
-- Name: cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart (
    id integer NOT NULL,
    member_id integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 235 (class 1259 OID 27284)
-- Name: cartItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."cartItem" (
    id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric DEFAULT 1 NOT NULL,
    added_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 27283)
-- Name: cartItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."cartItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4973 (class 0 OID 0)
-- Dependencies: 234
-- Name: cartItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."cartItem_id_seq" OWNED BY public."cartItem".id;


--
-- TOC entry 232 (class 1259 OID 27275)
-- Name: cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4974 (class 0 OID 0)
-- Dependencies: 232
-- Name: cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_id_seq OWNED BY public.cart.id;


--
-- TOC entry 217 (class 1259 OID 26432)
-- Name: comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment (
    id integer NOT NULL,
    review_id integer NOT NULL,
    member_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 218 (class 1259 OID 26438)
-- Name: comment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4975 (class 0 OID 0)
-- Dependencies: 218
-- Name: comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_id_seq OWNED BY public.comment.id;


--
-- TOC entry 237 (class 1259 OID 27295)
-- Name: discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    description text,
    "minQuantity" integer,
    "minAmount" numeric,
    "discountRate" numeric NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- TOC entry 239 (class 1259 OID 27305)
-- Name: discountProduct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."discountProduct" (
    id integer NOT NULL,
    discount_id integer NOT NULL,
    product_id integer NOT NULL
);


--
-- TOC entry 238 (class 1259 OID 27304)
-- Name: discountProduct_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."discountProduct_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 238
-- Name: discountProduct_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."discountProduct_id_seq" OWNED BY public."discountProduct".id;


--
-- TOC entry 236 (class 1259 OID 27294)
-- Name: discount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 236
-- Name: discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_id_seq OWNED BY public.discount.id;


--
-- TOC entry 219 (class 1259 OID 26439)
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    dob date NOT NULL,
    password character varying(255) NOT NULL,
    role integer NOT NULL,
    gender character(1) NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 26442)
-- Name: member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 220
-- Name: member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_id_seq OWNED BY public.member.id;


--
-- TOC entry 221 (class 1259 OID 26443)
-- Name: member_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_role (
    id integer NOT NULL,
    name character varying(25)
);


--
-- TOC entry 222 (class 1259 OID 26446)
-- Name: member_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4979 (class 0 OID 0)
-- Dependencies: 222
-- Name: member_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_role_id_seq OWNED BY public.member_role.id;


--
-- TOC entry 223 (class 1259 OID 26447)
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id integer NOT NULL,
    name character varying(255),
    description text,
    unit_price numeric NOT NULL,
    stock_quantity numeric DEFAULT 0 NOT NULL,
    country character varying(100),
    product_type character varying(50),
    image_url character varying(255) DEFAULT '/images/product.png'::character varying,
    manufactured_on timestamp without time zone
);


--
-- TOC entry 224 (class 1259 OID 26454)
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4980 (class 0 OID 0)
-- Dependencies: 224
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- TOC entry 225 (class 1259 OID 26455)
-- Name: review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review (
    id integer NOT NULL,
    member_id integer NOT NULL,
    product_id integer NOT NULL,
    rating integer,
    content text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    CONSTRAINT review_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 226 (class 1259 OID 26462)
-- Name: review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4981 (class 0 OID 0)
-- Dependencies: 226
-- Name: review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_id_seq OWNED BY public.review.id;


--
-- TOC entry 227 (class 1259 OID 26463)
-- Name: sale_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order (
    id integer NOT NULL,
    member_id integer,
    order_datetime timestamp without time zone NOT NULL,
    status character varying(10)
);


--
-- TOC entry 228 (class 1259 OID 26466)
-- Name: sale_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4982 (class 0 OID 0)
-- Dependencies: 228
-- Name: sale_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_id_seq OWNED BY public.sale_order.id;


--
-- TOC entry 229 (class 1259 OID 26467)
-- Name: sale_order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order_item (
    id integer NOT NULL,
    sale_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 26472)
-- Name: sale_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4983 (class 0 OID 0)
-- Dependencies: 230
-- Name: sale_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_item_id_seq OWNED BY public.sale_order_item.id;


--
-- TOC entry 4772 (class 2604 OID 27279)
-- Name: cart id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart ALTER COLUMN id SET DEFAULT nextval('public.cart_id_seq'::regclass);


--
-- TOC entry 4774 (class 2604 OID 27287)
-- Name: cartItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."cartItem" ALTER COLUMN id SET DEFAULT nextval('public."cartItem_id_seq"'::regclass);


--
-- TOC entry 4759 (class 2604 OID 26473)
-- Name: comment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment ALTER COLUMN id SET DEFAULT nextval('public.comment_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 27298)
-- Name: discount id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount ALTER COLUMN id SET DEFAULT nextval('public.discount_id_seq'::regclass);


--
-- TOC entry 4779 (class 2604 OID 27308)
-- Name: discountProduct id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."discountProduct" ALTER COLUMN id SET DEFAULT nextval('public."discountProduct_id_seq"'::regclass);


--
-- TOC entry 4761 (class 2604 OID 26474)
-- Name: member id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN id SET DEFAULT nextval('public.member_id_seq'::regclass);


--
-- TOC entry 4762 (class 2604 OID 26475)
-- Name: member_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role ALTER COLUMN id SET DEFAULT nextval('public.member_role_id_seq'::regclass);


--
-- TOC entry 4763 (class 2604 OID 26476)
-- Name: product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- TOC entry 4766 (class 2604 OID 26477)
-- Name: review id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review ALTER COLUMN id SET DEFAULT nextval('public.review_id_seq'::regclass);


--
-- TOC entry 4768 (class 2604 OID 26478)
-- Name: sale_order id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order ALTER COLUMN id SET DEFAULT nextval('public.sale_order_id_seq'::regclass);


--
-- TOC entry 4769 (class 2604 OID 26479)
-- Name: sale_order_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item ALTER COLUMN id SET DEFAULT nextval('public.sale_order_item_id_seq'::regclass);


--
-- TOC entry 4800 (class 2606 OID 26546)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4805 (class 2606 OID 27293)
-- Name: cartItem cartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."cartItem"
    ADD CONSTRAINT "cartItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 27282)
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- TOC entry 4782 (class 2606 OID 26481)
-- Name: comment comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT comment_pkey PRIMARY KEY (id);


--
-- TOC entry 4809 (class 2606 OID 27310)
-- Name: discountProduct discountProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."discountProduct"
    ADD CONSTRAINT "discountProduct_pkey" PRIMARY KEY (id);


--
-- TOC entry 4807 (class 2606 OID 27303)
-- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_pkey PRIMARY KEY (id);


--
-- TOC entry 4784 (class 2606 OID 26483)
-- Name: member member_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_email_key UNIQUE (email);


--
-- TOC entry 4786 (class 2606 OID 26485)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 26487)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 26489)
-- Name: member member_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_username_key UNIQUE (username);


--
-- TOC entry 4792 (class 2606 OID 26491)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- TOC entry 4794 (class 2606 OID 26493)
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (id);


--
-- TOC entry 4798 (class 2606 OID 26495)
-- Name: sale_order_item sale_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4796 (class 2606 OID 26497)
-- Name: sale_order sale_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_pkey PRIMARY KEY (id);


--
-- TOC entry 4803 (class 1259 OID 27311)
-- Name: cartItem_cart_id_product_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "cartItem_cart_id_product_id_key" ON public."cartItem" USING btree (cart_id, product_id);


--
-- TOC entry 4819 (class 2606 OID 27317)
-- Name: cartItem fk_cart_item_cart; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."cartItem"
    ADD CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON DELETE CASCADE;


--
-- TOC entry 4820 (class 2606 OID 27322)
-- Name: cartItem fk_cart_item_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."cartItem"
    ADD CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- TOC entry 4818 (class 2606 OID 27312)
-- Name: cart fk_cart_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT fk_cart_member FOREIGN KEY (member_id) REFERENCES public.member(id) ON DELETE CASCADE;


--
-- TOC entry 4810 (class 2606 OID 26498)
-- Name: comment fk_comment_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT fk_comment_member FOREIGN KEY (member_id) REFERENCES public.member(id);


--
-- TOC entry 4811 (class 2606 OID 26503)
-- Name: comment fk_comment_review; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment
    ADD CONSTRAINT fk_comment_review FOREIGN KEY (review_id) REFERENCES public.review(id);


--
-- TOC entry 4821 (class 2606 OID 27327)
-- Name: discountProduct fk_discount_product_discount; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."discountProduct"
    ADD CONSTRAINT fk_discount_product_discount FOREIGN KEY (discount_id) REFERENCES public.discount(id) ON DELETE CASCADE;


--
-- TOC entry 4822 (class 2606 OID 27332)
-- Name: discountProduct fk_discount_product_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."discountProduct"
    ADD CONSTRAINT fk_discount_product_product FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE CASCADE;


--
-- TOC entry 4812 (class 2606 OID 26508)
-- Name: member fk_member_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT fk_member_role_id FOREIGN KEY (role) REFERENCES public.member_role(id);


--
-- TOC entry 4813 (class 2606 OID 26513)
-- Name: review fk_review_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT fk_review_member FOREIGN KEY (member_id) REFERENCES public.member(id);


--
-- TOC entry 4814 (class 2606 OID 26518)
-- Name: review fk_review_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- TOC entry 4816 (class 2606 OID 26523)
-- Name: sale_order_item fk_sale_order_item_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_product FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- TOC entry 4817 (class 2606 OID 26528)
-- Name: sale_order_item fk_sale_order_item_sale_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_sale_order FOREIGN KEY (sale_order_id) REFERENCES public.sale_order(id);


--
-- TOC entry 4815 (class 2606 OID 26533)
-- Name: sale_order fk_sale_order_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT fk_sale_order_member FOREIGN KEY (member_id) REFERENCES public.member(id);


-- Completed on 2025-08-15 15:24:38

--
-- PostgreSQL database dump complete
--

